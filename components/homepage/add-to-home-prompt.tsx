'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Download, Info, X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'pwa_prompt_dismissed_until'
const DISMISS_DURATION_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

export default function AddToHomePrompt() {
  const [isVisible, setIsVisible] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const ua = window.navigator.userAgent
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        ua
      ) || window.matchMedia('(max-width: 768px)').matches

    if (!isMobile) return

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean(
        (window.navigator as Navigator & { standalone?: boolean }).standalone
      )

    if (standalone) return

    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0)
    if (dismissedUntil > Date.now()) return

    setIsVisible(true)

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setCanInstall(true)
    }

    const handleInstalled = () => {
      setIsVisible(false)
      setCanInstall(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DURATION_MS))
    setIsVisible(false)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setIsVisible(false)
      }
    } catch (error) {
      console.error('PWA install prompt failed:', error)
    } finally {
      setDeferredPrompt(null)
      setCanInstall(false)
      setInstalling(false)
    }
  }

  if (!isVisible) return null

  return (
    <div
      className="md:hidden fixed inset-x-4 bottom-4 z-50 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-4 fade-in duration-300"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Install StudentHub WebApp</p>
          <p className="text-xs text-muted-foreground mt-1">
            For quicker access to the mess menu.
          </p>
        </div>
        <button
          onClick={handleClose}
          aria-label="Dismiss install prompt"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {canInstall && (
          <Button size="sm" onClick={handleInstall} disabled={installing}>
            <Download className="h-4 w-4 mr-1" />
            {installing ? 'Opening...' : 'Add to Home Screen'}
          </Button>
        )}

        <Button size="sm" variant="outline" asChild>
          <Link href="/learn-more/add-to-home-screen">
            <Info className="h-4 w-4 mr-1" />
            Learn More
          </Link>
        </Button>
      </div>
    </div>
  )
}
