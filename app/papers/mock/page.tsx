'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Loader2, AlertCircle, BookOpen, Printer } from 'lucide-react'

type Status = 'loading' | 'streaming' | 'done' | 'error'

function MockPaperContent() {
  const params = useSearchParams()
  const subject = params.get('subject') ?? ''
  const semester = params.get('semester') ?? ''

  const [content, setContent] = useState('')
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [provider, setProvider] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!subject || !semester) {
      setError('Missing subject or semester in URL parameters.')
      setStatus('error')
      return
    }

    let cancelled = false

    const generate = async () => {
      const res = await fetch('/api/papers/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, semester: Number(semester) }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (!cancelled) {
          setError(
            (data as { error?: string }).error ??
              'Failed to generate mock paper.'
          )
          setStatus('error')
        }
        return
      }

      const p = res.headers.get('X-LLM-Provider')
      if (p && !cancelled) setProvider(p)
      if (!cancelled) setStatus('streaming')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done || cancelled) break
        const chunk = decoder.decode(value, { stream: true })
        setContent((prev) => prev + chunk)
      }

      if (!cancelled) setStatus('done')
    }

    generate().catch((err) => {
      if (!cancelled) {
        console.error('Mock generation error:', err)
        setError('An unexpected error occurred.')
        setStatus('error')
      }
    })

    return () => {
      cancelled = true
    }
  }, [subject, semester])

  // ── Full-page loader (before any content arrives) ──────────────────────────

  if ((status === 'loading' || status === 'streaming') && !content) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-74px)]">
        <div className="text-center space-y-5">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <BookOpen className="absolute inset-0 m-auto h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold">Analyzing past papers…</p>
            <p className="text-sm text-muted-foreground mt-1">
              Generating a mock paper for{' '}
              <span className="font-medium text-foreground">{subject}</span> ·
              Semester{' '}
              <span className="font-medium text-foreground">{semester}</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (status === 'error') {
    const needsKey = error.toLowerCase().includes('api key')
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-74px)]">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold">
            Could not generate mock paper
          </h2>
          <p className="text-muted-foreground text-sm">{error}</p>
          {needsKey && (
            <Link
              href="/profile"
              className="inline-block text-sm font-medium text-primary underline underline-offset-2"
            >
              Add your LLM API key in Profile →
            </Link>
          )}
        </div>
      </div>
    )
  }

  // ── Paper content (streaming + done) ──────────────────────────────────────

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Header bar */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 rounded-full px-3 py-1 mb-2">
            <BookOpen className="h-3 w-3" />
            AI-Generated Mock Paper
          </div>
          <h1 className="text-2xl font-bold">{subject}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Semester {semester}
            {provider ? ` · Generated with ${provider}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          {status === 'streaming' && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Generating…
            </span>
          )}
          {status === 'done' && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 text-sm px-3 py-1.5 border rounded-md hover:bg-muted transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
          )}
        </div>
      </div>

      {/* Generated paper */}
      <div
        ref={contentRef}
        className="prose prose-sm dark:prose-invert max-w-none border rounded-lg p-6 bg-card"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        {status === 'streaming' && content && (
          <span className="inline-block h-[1em] w-[2px] bg-primary animate-pulse align-middle ml-0.5" />
        )}
      </div>
    </div>
  )
}

export default function MockPaperPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-74px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <MockPaperContent />
    </Suspense>
  )
}
