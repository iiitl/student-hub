import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import Paper from '@/model/paper'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// ── Entry point ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { subject, semester } = body as { subject?: string; semester?: number }

  if (!subject?.trim() || !semester) {
    return NextResponse.json(
      { error: 'Subject and semester are required.' },
      { status: 400 }
    )
  }

  await dbConnect()

  const [user, papers] = await Promise.all([
    User.findOne({ email: session.user.email }).select(
      '+llmApiKey +llmProvider'
    ),
    Paper.find({
      subject: { $regex: new RegExp(`^${escapeRegex(subject.trim())}$`, 'i') },
      semester: Number(semester),
    })
      .sort({ year: -1 })
      .limit(3)
      .lean(),
  ])

  if (!user?.llmApiKey || !user?.llmProvider) {
    return NextResponse.json(
      {
        error:
          'No LLM API key found. Please add your API key in your profile first.',
      },
      { status: 400 }
    )
  }

  if (papers.length === 0) {
    return NextResponse.json(
      {
        error: `No past year papers found for "${subject}" Semester ${semester}. Upload some papers first to enable mock generation.`,
      },
      { status: 404 }
    )
  }

  const provider = user.llmProvider!
  const apiKey = user.llmApiKey!
  const encoder = new TextEncoder()

  // Providers that need base64 download for PDFs
  const needsDownload = ['OpenAI', 'Groq', 'Mistral'].includes(provider)

  // Build paper info list; download base64 for providers that require it
  const paperInfos: PaperInfo[] = await Promise.all(
    papers.map(async (p) => {
      const isPDF = p.file_type === 'application/pdf'
      let base64: string | null = null

      if (needsDownload && isPDF) {
        try {
          const res = await fetch(p.document_url)
          if (res.ok) {
            base64 = Buffer.from(await res.arrayBuffer()).toString('base64')
          }
        } catch {
          // fall through — will use URL-only fallback
        }
      }

      return {
        url: p.document_url,
        fileType: p.file_type,
        year: p.year,
        term: p.term,
        base64,
      }
    })
  )

  const prompt = buildPrompt(subject.trim(), Number(semester), paperInfos)

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await dispatch({
          provider,
          apiKey,
          paperInfos,
          prompt,
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
      'X-LLM-Provider': provider,
    },
  })
}

// ── Types ────────────────────────────────────────────────────────────────────

interface PaperInfo {
  url: string
  fileType: string
  year: number
  term: string
  base64: string | null
}

interface DispatchOpts {
  provider: string
  apiKey: string
  paperInfos: PaperInfo[]
  prompt: string
  controller: ReadableStreamDefaultController<Uint8Array>
  encoder: TextEncoder
}

// ── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(subject: string, semester: number, papers: PaperInfo[]) {
  const refs = papers.map((p) => `  - ${p.year} ${p.term} exam`).join('\n')

  return `You are an experienced professor. I have provided ${papers.length} past year question paper(s) for the subject "${subject}" (Semester ${semester}):
${refs}

Analyze the papers carefully — their structure, sections, question types, marks distribution, topic coverage, and time allocation.

Then generate a brand-new MOCK QUESTION PAPER that:
1. Follows the exact same format and section structure as the PYQs
2. Covers the same topics with proportional weightage
3. Matches the total marks and time duration
4. Uses completely different questions (no direct copy)
5. Is clearly formatted in Markdown

Start with a header block, for example:

# MOCK QUESTION PAPER
**Subject:** ${subject}
**Semester:** ${semester}
**Time Allowed:** [infer from PYQs]
**Maximum Marks:** [infer from PYQs]

---

Then write the complete mock paper with all sections and questions, including marks for each.`
}

// ── Provider router ──────────────────────────────────────────────────────────

async function dispatch(opts: DispatchOpts) {
  switch (opts.provider) {
    case 'Anthropic':
      return mockAnthropic(opts)
    case 'OpenAI':
      return mockOpenAI(opts)
    case 'Gemini':
      return mockGemini(opts)
    case 'Groq':
      return mockGroq(opts)
    case 'Mistral':
      return mockMistral(opts)
    case 'Cohere':
      return mockCohere(opts)
    default:
      throw new Error(`Unsupported provider: ${opts.provider}`)
  }
}

// ── SSE parser (shared) ──────────────────────────────────────────────────────

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
          /* skip */
        }
      }
    }
  }
}

// ── Anthropic ────────────────────────────────────────────────────────────────

async function mockAnthropic({
  apiKey,
  paperInfos,
  prompt,
  controller,
  encoder,
}: DispatchOpts) {
  const mediaBlocks = paperInfos.map((p) => {
    const isPDF = p.fileType === 'application/pdf'
    return isPDF
      ? { type: 'document', source: { type: 'url', url: p.url } }
      : { type: 'image', source: { type: 'url', url: p.url } }
  })

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
        {
          role: 'user',
          content: [...mediaBlocks, { type: 'text', text: prompt }],
        },
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

async function mockOpenAI({
  apiKey,
  paperInfos,
  prompt,
  controller,
  encoder,
}: DispatchOpts) {
  const mediaBlocks = paperInfos.map((p) => {
    const isPDF = p.fileType === 'application/pdf'
    const url =
      isPDF && p.base64 ? `data:application/pdf;base64,${p.base64}` : p.url
    return { type: 'image_url', image_url: { url, detail: 'high' } }
  })

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
          content: [...mediaBlocks, { type: 'text', text: prompt }],
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

async function mockGemini({
  apiKey,
  paperInfos,
  prompt,
  controller,
  encoder,
}: DispatchOpts) {
  const parts = [
    ...paperInfos.map((p) => ({
      fileData: { mimeType: p.fileType, fileUri: p.url },
    })),
    { text: prompt },
  ]

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
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

async function mockGroq({
  apiKey,
  paperInfos,
  prompt,
  controller,
  encoder,
}: DispatchOpts) {
  const mediaBlocks = paperInfos.map((p) => {
    const isPDF = p.fileType === 'application/pdf'
    const url =
      isPDF && p.base64 ? `data:application/pdf;base64,${p.base64}` : p.url
    return { type: 'image_url', image_url: { url } }
  })

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
          content: [...mediaBlocks, { type: 'text', text: prompt }],
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

async function mockMistral({
  apiKey,
  paperInfos,
  prompt,
  controller,
  encoder,
}: DispatchOpts) {
  const mediaBlocks = paperInfos.map((p) => {
    const isPDF = p.fileType === 'application/pdf'
    const url =
      isPDF && p.base64 ? `data:application/pdf;base64,${p.base64}` : p.url
    return { type: 'image_url', image_url: { url } }
  })

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
          content: [...mediaBlocks, { type: 'text', text: prompt }],
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

async function mockCohere({ controller, encoder }: DispatchOpts) {
  const msg = [
    '## Provider Limitation',
    '',
    'Your current LLM provider **Cohere** does not support image or PDF analysis.',
    '',
    'The **Generate Mock Paper** feature requires a vision-capable model that can read the past year papers. Please go to your [Profile](/profile) and switch to one of:',
    '',
    '- **Anthropic** — Claude Opus (recommended)',
    '- **OpenAI** — GPT-4o',
    '- **Gemini** — Gemini 1.5 Pro',
    '- **Groq** — Llama 3.2 Vision',
    '- **Mistral** — Pixtral Large',
  ].join('\n')

  controller.enqueue(encoder.encode(msg))
}

// ── Util ─────────────────────────────────────────────────────────────────────

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
