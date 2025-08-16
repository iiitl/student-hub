'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'

interface PdfModalProps {
  url: string | null
  setUrl: (url: string | null) => void
}

export function PdfModal({ url, setUrl }: PdfModalProps) {
  return (
    <Dialog open={!!url} onOpenChange={(open) => !open && setUrl(null)}>
      <DialogContent className="max-w-5xl w-full h-[80vh] p-0 overflow-hidden gap-0 flex flex-col">
        <DialogHeader className="px-4 py-2 border-b h-fit">
          <DialogTitle className="text-lg font-semibold">
            PDF Preview
          </DialogTitle>
        </DialogHeader>
        {url ? (
          <div className="flex flex-1">
            <embed src={url} type="application/pdf" className="w-full h-full" />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
