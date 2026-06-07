'use client'

import type React from 'react'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { headerLinks, isLinkGroup, HeaderLink } from '@/data/header-links'
import ThemeToggle from './theme-toggler'
import AuthNav from './auth/auth-nav'

const mobileLinks: HeaderLink[] = headerLinks.flatMap((link) =>
  isLinkGroup(link) ? link.items : [link]
)

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center gap-2 lg:hidden">
      <ThemeToggle />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-8 w-8" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[260px] sm:w-[300px] p-4 flex flex-col overflow-hidden"
        >
          <SheetHeader>
            <SheetTitle className="text-left text-lg text-primary">
              Menu
            </SheetTitle>
          </SheetHeader>
          <nav className="grid grid-cols-2 gap-2 px-1 flex-1 content-start">
            {mobileLinks.map((link) => (
              <MobileNavLink key={link.url} link={link} setOpen={setOpen} />
            ))}
          </nav>
          <SheetFooter className="mt-auto pt-3 border-t">
            <div className="w-full flex justify-center">
              <AuthNav />
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function MobileNavLink({
  link,
  setOpen,
}: {
  link: HeaderLink
  setOpen: (open: boolean) => void
}) {
  return (
    <Link
      href={link.url}
      className="flex items-center justify-center rounded-md border border-border bg-background px-2 py-2 text-sm opacity-80 hover:text-primary hover:border-primary/30 transition-colors text-center leading-tight"
      onClick={() => setOpen(false)}
    >
      {link.name}
    </Link>
  )
}
