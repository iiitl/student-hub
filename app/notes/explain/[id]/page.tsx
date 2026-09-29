'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  BookOpen,
  FileText,
  Loader2,
  AlertCircle,
  Lightbulb,
} from 'lucide-react'

type NoteMeta = {
  id: string
  subject: string
  facultyName?: string
  semester: number
  exam: string
  batch: number
  url: string
  fileType: string
  fileName?: string
  description?: string
  category?: string
}

type Status = 'loading' | 'explaining' | 'done' | 'error'

export default function ExplainNotePage() {
  const { id } = useParams<{ id: string }>()

  const [note, setNote] = useState<NoteMeta | null>(null)
  const [explanation, setExplanation] = useState('')
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [provider, setProvider] = useState('')

  const explanationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return

    let cancelled = false

    const run = async () => {
      // ── 1. Fetch note metadata ─────────────────────────────────────────────
      const metaRes = await fetch(`/api/notes/${id}`)
      if (!metaRes.ok) {
        if (!cancelled) {
          setError('Note not found.')
          setStatus('error')
        }
        return
      }
      const meta: NoteMeta = await metaRes.json()
      if (!cancelled) setNote(meta)

      // ── 2. Start the explain stream ────────────────────────────────────────
      if (!cancelled) setStatus('explaining')

      const explainRes = await fetch('/api/notes/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: id }),
      })

      if (!explainRes.ok) {
        const data = await explainRes.json().catch(() => ({}))
        if (!cancelled) {
          setError(
            (data as { error?: string }).error ??
              'Failed to generate explanation.'
          )
          setStatus('error')
        }
        return
      }

      const p = explainRes.headers.get('X-LLM-Provider')
      if (p && !cancelled) setProvider(p)

      // ── 3. Read the stream ─────────────────────────────────────────────────
      const reader = explainRes.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done || cancelled) break
        const chunk = decoder.decode(value, { stream: true })
        setExplanation((prev) => prev + chunk)
        if (explanationRef.current) {
          explanationRef.current.scrollTop = explanationRef.current.scrollHeight
        }
      }

      if (!cancelled) setStatus('done')
    }

    run().catch((err) => {
      if (!cancelled) {
        console.error('Explain page error:', err)
        setError('An unexpected error occurred.')
        setStatus('error')
      }
    })

    return () => {
      cancelled = true
    }
  }, [id])

  // ── Loading ────────────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-74px)]">
        <div className="text-center space-y-4">
          <div className="h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading note…</p>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (status === 'error') {
    const needsKey = error.toLowerCase().includes('api key')
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-74px)]">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold">
            Could not generate explanation
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

  // ── Split view ─────────────────────────────────────────────────────────────

  const isPDF = note?.fileType === 'application/pdf'

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: 'calc(100vh - 74px)' }}
    >
      {/* Top bar */}
      <div className="flex-shrink-0 border-b px-6 py-3 flex items-center justify-between gap-4 bg-background">
        <div className="min-w-0">
          <h1 className="font-semibold text-base truncate">{note?.subject}</h1>
          <p className="text-xs text-muted-foreground">
            {note?.exam} · Semester {note?.semester} · {note?.batch}
            {note?.facultyName ? ` · ${note.facultyName}` : ''}
          </p>
        </div>

        {status === 'explaining' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            <span>Explaining{provider ? ` with ${provider}` : ''}…</span>
          </div>
        )}
        {status === 'done' && (
          <span className="text-sm font-medium text-green-600 dark:text-green-400 flex-shrink-0">
            ✓ Done{provider ? ` · ${provider}` : ''}
          </span>
        )}
      </div>

      {/* Two-panel body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left — note viewer */}
        <div className="w-1/2 flex flex-col border-r overflow-hidden">
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b bg-muted/30 text-sm font-medium">
            <FileText className="h-4 w-4 text-primary" />
            Note
          </div>
          <div className="flex-1 overflow-auto">
            {isPDF ? (
              <iframe
                src={note?.url}
                title="Note"
                className="w-full h-full border-0"
              />
            ) : (
              <div className="p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={note?.url}
                  alt="Note"
                  className="w-full h-auto object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right — AI explanation */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b bg-muted/30 text-sm font-medium">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            AI Explanation
          </div>

          {/* Spinner before first token */}
          {status === 'explaining' && !explanation && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="relative mx-auto h-14 w-14">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-200 dark:border-amber-800/40 border-t-amber-500 animate-spin" />
                  <BookOpen className="absolute inset-0 m-auto h-5 w-5 text-amber-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Analyzing note content…
                </p>
              </div>
            </div>
          )}

          {/* Streaming / final explanation */}
          <div
            ref={explanationRef}
            className="flex-1 overflow-auto p-6 prose prose-sm dark:prose-invert max-w-none"
          >
            {explanation && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {explanation}
              </ReactMarkdown>
            )}
            {status === 'explaining' && explanation && (
              <span className="inline-block h-[1em] w-[2px] bg-amber-500 animate-pulse align-middle ml-0.5" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
