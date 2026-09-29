'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { KeyRound, X } from 'lucide-react'

const DISMISS_KEY = 'llm-banner-dismissed'

export default function LlmApiKeyBanner() {
  const { data: session, status } = useSession()
  const [hasKey, setHasKey] = useState<boolean | null>(null)
  const [dismissed, setDismissed] = useState(true) // start hidden to avoid flash

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return

    fetch('/api/user/llm-api-key')
      .then((r) => r.json())
      .then((data) => setHasKey(data.hasKey))
      .catch(() => setHasKey(true)) // fail silently — don't show banner on error
  }, [status, session])

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  if (status !== 'authenticated' || hasKey !== false || dismissed) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/40 px-4 py-3">
      <div className="container mx-auto max-w-5xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300 truncate">
            To experience the full potential of Student Hub, add your LLM API
            key now by going to your{' '}
            <Link
              href="/profile"
              className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
            >
              profile
            </Link>
            .
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss banner"
          className="flex-shrink-0 p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors text-amber-600 dark:text-amber-400 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
