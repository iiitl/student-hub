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
import { headerLinks } from '@/data/header-links'
import ThemeToggle from './theme-toggler'
import AuthNav from './auth/auth-nav'

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
        <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-left text-2xl text-primary">
              Menu
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-2 ml-4 flex-1">
            {headerLinks.map((link, index) => (
              <MobileNavLink key={index} href={link.url} setOpen={setOpen}>
                {link.name}
              </MobileNavLink>
            ))}
          </nav>
          <SheetFooter className="mt-auto pt-4 border-t">
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
      className="flex items-center opacity-70 py-2 text-lg hover:text-primary transition-colors"
      onClick={() => setOpen(false)}
    >
      {children}
    </Link>
  )
}
