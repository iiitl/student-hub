'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BookOpen, FileText, Loader2, AlertCircle } from 'lucide-react'

type PaperMeta = {
  id: string
  subject: string
  facultyName?: string
  semester: number
  exam: string
  batch: number
  url: string
  fileType: string
  fileName?: string
}

type Status = 'loading' | 'solving' | 'done' | 'error'

export default function SolvePage() {
  const { id } = useParams<{ id: string }>()

  const [paper, setPaper] = useState<PaperMeta | null>(null)
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [provider, setProvider] = useState('')

  const answerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return

    let cancelled = false

    const run = async () => {
      // ── 1. Fetch paper metadata ──────────────────────────────────────────
      const metaRes = await fetch(`/api/papers/${id}`)
      if (!metaRes.ok) {
        if (!cancelled) {
          setError('Question paper not found.')
          setStatus('error')
        }
        return
      }
      const meta: PaperMeta = await metaRes.json()
      if (!cancelled) setPaper(meta)

      // ── 2. Start the solve stream ────────────────────────────────────────
      if (!cancelled) setStatus('solving')

      const solveRes = await fetch('/api/papers/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: id }),
      })

      if (!solveRes.ok) {
        const data = await solveRes.json().catch(() => ({}))
        if (!cancelled) {
          setError(
            (data as { error?: string }).error ?? 'Failed to generate answers.'
          )
          setStatus('error')
        }
        return
      }

      const p = solveRes.headers.get('X-LLM-Provider')
      if (p && !cancelled) setProvider(p)

      // ── 3. Read the stream ───────────────────────────────────────────────
      const reader = solveRes.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done || cancelled) break
        const chunk = decoder.decode(value, { stream: true })
        setAnswer((prev) => prev + chunk)
        if (answerRef.current) {
          answerRef.current.scrollTop = answerRef.current.scrollHeight
        }
      }

      if (!cancelled) setStatus('done')
    }

    run().catch((err) => {
      if (!cancelled) {
        console.error('Solve page error:', err)
        setError('An unexpected error occurred.')
        setStatus('error')
      }
    })

    return () => {
      cancelled = true
    }
  }, [id])

  // ── Loading ──────────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-74px)]">
        <div className="text-center space-y-4">
          <div className="h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading question paper…</p>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (status === 'error') {
    const needsKey = error.toLowerCase().includes('api key')
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-74px)]">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold">Could not generate answers</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
          {needsKey && (
            <Link
              href="/profile"
              className="inline-block mt-2 text-sm font-medium text-primary underline underline-offset-2"
            >
              Add your LLM API key in Profile →
            </Link>
          )}
        </div>
      </div>
    )
  }

  // ── Split view (solving + done) ──────────────────────────────────────────

  const isPDF = paper?.fileType === 'application/pdf'

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: 'calc(100vh - 74px)' }}
    >
      {/* ── Top bar ── */}
      <div className="flex-shrink-0 border-b px-6 py-3 flex items-center justify-between gap-4 bg-background">
        <div className="min-w-0">
          <h1 className="font-semibold text-base truncate">{paper?.subject}</h1>
          <p className="text-xs text-muted-foreground">
            {paper?.exam} · Semester {paper?.semester} · {paper?.batch}
            {paper?.facultyName ? ` · ${paper.facultyName}` : ''}
          </p>
        </div>

        {status === 'solving' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>
              Generating answers{provider ? ` with ${provider}` : ''}…
            </span>
          </div>
        )}
        {status === 'done' && (
          <span className="text-sm font-medium text-green-600 dark:text-green-400 flex-shrink-0">
            ✓ Done{provider ? ` · ${provider}` : ''}
          </span>
        )}
      </div>

      {/* ── Two-panel body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left — question paper viewer */}
        <div className="w-1/2 flex flex-col border-r overflow-hidden">
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b bg-muted/30 text-sm font-medium">
            <FileText className="h-4 w-4 text-primary" />
            Question Paper
          </div>
          <div className="flex-1 overflow-auto">
            {isPDF ? (
              <iframe
                src={paper?.url}
                title="Question Paper"
                className="w-full h-full border-0"
              />
            ) : (
              <div className="p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={paper?.url}
                  alt="Question Paper"
                  className="w-full h-auto object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right — AI answers */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b bg-muted/30 text-sm font-medium">
            <BookOpen className="h-4 w-4 text-primary" />
            AI-Generated Answers
          </div>

          {/* Spinner shown while stream hasn't produced any text yet */}
          {status === 'solving' && !answer && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="relative mx-auto h-14 w-14">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <BookOpen className="absolute inset-0 m-auto h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Analyzing question paper…
                </p>
              </div>
            </div>
          )}

          {/* Streaming / final answer */}
          <div
            ref={answerRef}
            className="flex-1 overflow-auto p-6 prose prose-sm dark:prose-invert max-w-none"
          >
            {answer && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {answer}
              </ReactMarkdown>
            )}
            {/* Blinking cursor while streaming */}
            {status === 'solving' && answer && (
              <span className="inline-block h-[1em] w-[2px] bg-primary animate-pulse align-middle ml-0.5" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
