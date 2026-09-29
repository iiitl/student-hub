import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import Paper from '@/model/paper'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const SOLVE_PROMPT = `You are an expert academic tutor. Carefully analyze this question paper and provide comprehensive, detailed answers to ALL questions.

Format your response in Markdown:
- Use ## for each major question (e.g., ## Question 1)
- Use ### for sub-parts (e.g., ### Part (a))
- Use bullet points, numbered lists, tables, and code blocks where appropriate
- Explain your reasoning wherever it aids understanding
- Be thorough — answer every single question in the paper.`

// ── Entry point ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { paperId } = body
  if (!paperId) {
    return NextResponse.json({ error: 'Paper ID is required' }, { status: 400 })
  }

  await dbConnect()

  // Note: User must NOT use .lean() — lean() skips Mongoose's Document layer
  // which is required for the '+fieldName' override of select:false fields.
  const [paper, user] = await Promise.all([
    Paper.findById(paperId).lean(),
    User.findOne({ email: session.user.email }).select(
      '+llmApiKey +llmProvider'
    ),
  ])

  if (!paper) {
    return NextResponse.json({ error: 'Paper not found' }, { status: 404 })
  }

  if (!user?.llmApiKey || !user?.llmProvider) {
    return NextResponse.json(
      {
        error:
          'No LLM API key found. Please add your API key in your profile first.',
      },
      { status: 400 }
    )
  }

  const llmProvider = user.llmProvider!
  const llmApiKey = user.llmApiKey!
  const fileUrl: string = paper.document_url
  const fileType: string = paper.file_type

  // Providers that need the file downloaded as base64 for PDF inputs
  let fileBase64: string | null = null
  const needsDownload =
    fileType === 'application/pdf' &&
    (llmProvider === 'OpenAI' ||
      llmProvider === 'Groq' ||
      llmProvider === 'Mistral')

  if (needsDownload) {
    try {
      const fileRes = await fetch(fileUrl)
      if (!fileRes.ok) throw new Error('Fetch failed')
      fileBase64 = Buffer.from(await fileRes.arrayBuffer()).toString('base64')
    } catch {
      return NextResponse.json(
        { error: 'Failed to download the paper file from storage.' },
        { status: 500 }
      )
    }
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await dispatchProvider({
          provider: llmProvider,
          apiKey: llmApiKey,
          fileUrl,
          fileType,
          fileBase64,
          prompt: SOLVE_PROMPT,
          controller,
          encoder,
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unexpected LLM error'
        controller.enqueue(encoder.encode(`\n\n> **Error:** ${msg}`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-LLM-Provider': llmProvider,
    },
  })
}

// ── Shared types ─────────────────────────────────────────────────────────────

interface ProviderOpts {
  provider: string
  apiKey: string
  fileUrl: string
  fileType: string
  fileBase64: string | null
  prompt: string
  controller: ReadableStreamDefaultController<Uint8Array>
  encoder: TextEncoder
}

// ── Router ───────────────────────────────────────────────────────────────────

async function dispatchProvider(opts: ProviderOpts) {
  switch (opts.provider) {
    case 'Anthropic':
      return streamAnthropic(opts)
    case 'OpenAI':
      return streamOpenAI(opts)
    case 'Gemini':
      return streamGemini(opts)
    case 'Groq':
      return streamGroq(opts)
    case 'Mistral':
      return streamMistral(opts)
    case 'Cohere':
      return streamCohere(opts)
    default:
      throw new Error(`Unsupported provider: ${opts.provider}`)
  }
}

// ── SSE parser (OpenAI-compatible format) ────────────────────────────────────
// Used by Anthropic, OpenAI, Groq, Mistral, Gemini (all use SSE)

async function pipeSSE(
  response: Response,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  extract: (parsed: unknown) => string | null | undefined
) {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      const t = line.trim()
      if (!t || t === 'data: [DONE]') continue
      if (t.startsWith('data: ')) {
        try {
          const text = extract(JSON.parse(t.slice(6)))
          if (text) controller.enqueue(encoder.encode(text))
        } catch {
          /* skip malformed chunks */
        }
      }
    }
  }
}

// ── Anthropic ────────────────────────────────────────────────────────────────

async function streamAnthropic({
  apiKey,
  fileUrl,
  fileType,
  prompt,
  controller,
  encoder,
}: ProviderOpts) {
  const isPDF = fileType === 'application/pdf'

  // Anthropic supports URL sources for both images and documents natively
  const mediaBlock = isPDF
    ? { type: 'document', source: { type: 'url', url: fileUrl } }
    : { type: 'image', source: { type: 'url', url: fileUrl } }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 8192,
      stream: true,
      messages: [
        { role: 'user', content: [mediaBlock, { type: 'text', text: prompt }] },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ??
        `Anthropic error ${res.status}`
    )
  }

  await pipeSSE(res, controller, encoder, (p) => {
    const parsed = p as {
      type?: string
      delta?: { type?: string; text?: string }
    }
    if (
      parsed?.type === 'content_block_delta' &&
      parsed?.delta?.type === 'text_delta'
    ) {
      return parsed.delta.text
    }
  })
}

// ── OpenAI ───────────────────────────────────────────────────────────────────

async function streamOpenAI({
  apiKey,
  fileUrl,
  fileType,
  fileBase64,
  prompt,
  controller,
  encoder,
}: ProviderOpts) {
  const isPDF = fileType === 'application/pdf'

  const mediaContent =
    isPDF && fileBase64
      ? {
          type: 'image_url',
          image_url: {
            url: `data:application/pdf;base64,${fileBase64}`,
            detail: 'high',
          },
        }
      : { type: 'image_url', image_url: { url: fileUrl, detail: 'high' } }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      stream: true,
      messages: [
        {
          role: 'user',
          content: [mediaContent, { type: 'text', text: prompt }],
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ??
        `OpenAI error ${res.status}`
    )
  }

  await pipeSSE(res, controller, encoder, (p) => {
    const parsed = p as { choices?: { delta?: { content?: string } }[] }
    return parsed?.choices?.[0]?.delta?.content
  })
}

// ── Gemini ───────────────────────────────────────────────────────────────────

async function streamGemini({
  apiKey,
  fileUrl,
  fileType,
  prompt,
  controller,
  encoder,
}: ProviderOpts) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { fileData: { mimeType: fileType, fileUri: fileUrl } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 8192 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ??
        `Gemini error ${res.status}`
    )
  }

  await pipeSSE(res, controller, encoder, (p) => {
    const parsed = p as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    return parsed?.candidates?.[0]?.content?.parts?.[0]?.text
  })
}

// ── Groq ─────────────────────────────────────────────────────────────────────

async function streamGroq({
  apiKey,
  fileUrl,
  fileType,
  fileBase64,
  prompt,
  controller,
  encoder,
}: ProviderOpts) {
  const isPDF = fileType === 'application/pdf'

  const mediaContent =
    isPDF && fileBase64
      ? {
          type: 'image_url',
          image_url: { url: `data:application/pdf;base64,${fileBase64}` },
        }
      : { type: 'image_url', image_url: { url: fileUrl } }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.2-90b-vision-preview',
      stream: true,
      messages: [
        {
          role: 'user',
          content: [mediaContent, { type: 'text', text: prompt }],
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ??
        `Groq error ${res.status}`
    )
  }

  await pipeSSE(res, controller, encoder, (p) => {
    const parsed = p as { choices?: { delta?: { content?: string } }[] }
    return parsed?.choices?.[0]?.delta?.content
  })
}

// ── Mistral ───────────────────────────────────────────────────────────────────

async function streamMistral({
  apiKey,
  fileUrl,
  fileType,
  fileBase64,
  prompt,
  controller,
  encoder,
}: ProviderOpts) {
  const isPDF = fileType === 'application/pdf'

  const mediaContent =
    isPDF && fileBase64
      ? {
          type: 'image_url',
          image_url: { url: `data:application/pdf;base64,${fileBase64}` },
        }
      : { type: 'image_url', image_url: { url: fileUrl } }

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'pixtral-large-latest',
      stream: true,
      messages: [
        {
          role: 'user',
          content: [mediaContent, { type: 'text', text: prompt }],
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ??
        `Mistral error ${res.status}`
    )
  }

  await pipeSSE(res, controller, encoder, (p) => {
    const parsed = p as { choices?: { delta?: { content?: string } }[] }
    return parsed?.choices?.[0]?.delta?.content
  })
}

// ── Cohere ────────────────────────────────────────────────────────────────────
// Cohere does not support vision — stream an informative limitation message.

async function streamCohere({ controller, encoder }: ProviderOpts) {
  const msg = [
    '## Provider Limitation',
    '',
    'Your current LLM provider **Cohere** does not support image or PDF analysis.',
    '',
    'The **Solve Question Paper** feature requires a vision-capable model. Please go to your [Profile](/profile) and switch your API key to one of:',
    '',
    '- **Anthropic** — Claude Opus (recommended)',
    '- **OpenAI** — GPT-4o',
    '- **Gemini** — Gemini 1.5 Pro',
    '- **Groq** — Llama 3.2 Vision',
    '- **Mistral** — Pixtral Large',
  ].join('\n')

  controller.enqueue(encoder.encode(msg))
}
