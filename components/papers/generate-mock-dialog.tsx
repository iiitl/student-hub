'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { Wand2, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  subjects: string[]
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

const selectClass =
  'w-full appearance-none px-3 py-2 pr-8 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50'

export default function GenerateMockDialog({ subjects }: Props) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [semester, setSemester] = useState('')

  const availableSubjects = subjects.filter((s) => s !== 'All')

  const handleGenerate = () => {
    if (!subject || !semester) return
    window.open(
      `/papers/mock?subject=${encodeURIComponent(subject)}&semester=${encodeURIComponent(semester)}`,
      '_blank'
    )
    setOpen(false)
    setSubject('')
    setSemester('')
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Wand2 className="h-4 w-4" />
          Generate Mock Paper
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Panel */}
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-background border rounded-xl shadow-2xl p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Wand2 className="h-4 w-4 text-primary" />
              </div>
              <Dialog.Title className="text-lg font-semibold leading-tight">
                Generate Mock Question Paper
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="rounded-full p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-muted-foreground mb-5 ml-11">
            We&apos;ll analyze past year papers for the selected subject and
            semester, then generate a fresh mock paper using your LLM.
          </Dialog.Description>

          {/* Fields */}
          <div className="space-y-4">
            {/* Subject */}
            <div>
              <label
                htmlFor="mock-subject"
                className="block text-sm font-medium mb-1.5"
              >
                Subject
              </label>
              <div className="relative">
                <select
                  id="mock-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select a subject…</option>
                  {availableSubjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {availableSubjects.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No papers uploaded yet — upload some papers first.
                </p>
              )}
            </div>

            {/* Semester */}
            <div>
              <label
                htmlFor="mock-semester"
                className="block text-sm font-medium mb-1.5"
              >
                Semester
              </label>
              <div className="relative">
                <select
                  id="mock-semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select a semester…</option>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button
              onClick={handleGenerate}
              disabled={!subject || !semester}
              className="flex items-center gap-2"
            >
              <Wand2 className="h-4 w-4" />
              Generate
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
