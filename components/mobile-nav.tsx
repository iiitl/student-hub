"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-8">
          <MobileNavLink href="/quick-reads" setOpen={setOpen}>
            Quick Reads
          </MobileNavLink>
          <MobileNavLink href="/notes" setOpen={setOpen}>
            Notes
          </MobileNavLink>
          <MobileNavLink href="/papers" setOpen={setOpen}>
            Question Papers
          </MobileNavLink>
          <MobileNavLink href="/marketplace" setOpen={setOpen}>
            Marketplace
          </MobileNavLink>
          <MobileNavLink href="/chat" setOpen={setOpen}>
            Chat
          </MobileNavLink>
          <MobileNavLink href="/newcomers" setOpen={setOpen}>
            Newcomers
          </MobileNavLink>
          <MobileNavLink href="/contributors" setOpen={setOpen}>
            Contributors
          </MobileNavLink>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

function MobileNavLink({
  href,
  children,
  setOpen,
}: {
  href: string
  children: React.ReactNode
  setOpen: (open: boolean) => void
}) {
  return (
    <Link
      href={href}
      className="flex items-center py-2 text-lg hover:text-primary transition-colors"
      onClick={() => setOpen(false)}
    >
      {children}
    </Link>
  )
}



