'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

/**
 * PWA launch entry point.
 * - Authenticated users: redirect to their configured landing page.
 * - Unauthenticated users: redirect to home page.
 *
 * This page is set as `start_url` in manifest.json so that when the
 * app is launched from the home screen it always goes through here.
 */
export default function PwaLaunch() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.replace('/')
      return
    }

    // Authenticated – fetch the user's preferred landing page
    fetch('/api/user/landing-page')
      .then((res) => (res.ok ? res.json() : { landingPage: '/' }))
      .then(({ landingPage }) => {
        router.replace(landingPage || '/')
      })
      .catch(() => {
        router.replace('/')
      })
  }, [status, router])

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="animate-pulse text-center space-y-3">
        <div className="h-16 w-16 rounded-full bg-primary/20 mx-auto" />
        <p className="text-sm text-muted-foreground">Loading StudentHub…</p>
      </div>
    </div>
  )
}
