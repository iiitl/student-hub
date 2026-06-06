'use client'

import { useEffect, useMemo, useState } from 'react'
import { MESS_DAYS, MESS_MEAL_TYPES, type DayMenu } from '@/lib/mess-menu'
import { Loader2, AlertCircle, UtensilsCrossed, Info } from 'lucide-react'

type MessMenuResponse = {
  success: boolean
  menu?: DayMenu[]
  message?: string
  fetchedAt?: string
}

export default function MessMenuPage() {
  const [menu, setMenu] = useState<DayMenu[]>([])
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    new Date().getDay()
  )
  const [fetchedAt, setFetchedAt] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showSyncInfo, setShowSyncInfo] = useState(false)

  useEffect(() => {
    const loadMenu = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/mess-menu', { cache: 'no-store' })
        const data: MessMenuResponse = await response.json()

        if (!response.ok || !data.success || !data.menu) {
          setError(data.message || 'Failed to load mess menu')
          return
        }

        setMenu(data.menu)
        setFetchedAt(data.fetchedAt || '')
      } catch (e) {
        console.error('Mess menu page load failed:', e)
        setError('Unable to load mess menu right now')
      } finally {
        setIsLoading(false)
      }
    }

    loadMenu()
  }, [])

  const formattedFetchedAt = useMemo(() => {
    if (!fetchedAt) return ''
    return new Date(fetchedAt).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [fetchedAt])

  const selectedDayMenu = menu[selectedDayIndex]

  const formatFoodItems = (value: string | undefined) => {
    if (!value) return '-'
    return value
      .replace(/\s*\n+\s*/g, ', ')
      .replace(/\s{2,}/g, ' ')
      .replace(/,\s*,/g, ', ')
      .trim()
  }

  const goToDay = (nextIndex: number) => {
    if (nextIndex < 0) {
      setSelectedDayIndex(MESS_DAYS.length - 1)
      return
    }
    if (nextIndex >= MESS_DAYS.length) {
      setSelectedDayIndex(0)
      return
    }
    setSelectedDayIndex(nextIndex)
  }

  if (isLoading) {
    return (
      <main className="min-h-screen px-4 py-10 md:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl border border-border bg-card p-8">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Loading mess menu...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen px-4 py-10 md:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700">
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Unable to load Mess Menu</h1>
          </div>
          <p>{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-2 py-4 md:px-8 md:py-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-2 rounded-2xl p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Mess Menu</h1>
            </div>

            {formattedFetchedAt && (
              <button
                type="button"
                aria-label="Show sync info"
                title="Show sync info"
                onClick={() => setShowSyncInfo((prev) => !prev)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
              >
                <Info className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Day-wise menu synced from MessEase Db.
          </p>

          {formattedFetchedAt && showSyncInfo && (
            <div className="mt-3 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Last synced: {formattedFetchedAt}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted"
              onClick={() => goToDay(selectedDayIndex - 1)}
            >
              Previous Day
            </button>

            <button
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted"
              onClick={() => goToDay(selectedDayIndex + 1)}
            >
              Next Day
            </button>
          </div>
        </div>

        <div className="rounded-2xl p-2 shadow-sm">
          <h2 className="text-xl font-semibold">
            {MESS_DAYS[selectedDayIndex]}
            {selectedDayIndex === new Date().getDay() ? ' (Today)' : ''}
          </h2>

          <div className="mt-2 space-y-3">
            {MESS_MEAL_TYPES.map((mealType, mealIndex) => {
              const item = selectedDayMenu?.particulars?.[mealIndex]
              return (
                <div
                  key={mealType}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <div className="mb-2">
                    <p className="font-semibold text-foreground">{mealType}</p>
                  </div>
                  <div className="rounded-md border border-border bg-card p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Items
                    </p>
                    <p className="line-clamp-2 text-sm leading-relaxed text-foreground">
                      {formatFoodItems(item?.food)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
