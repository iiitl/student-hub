'use client'

import type React from 'react'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  headerLinks,
  isLinkGroup,
  HeaderLinkItem,
  HeaderLink,
} from '@/data/header-links'
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
        <SheetContent
          side="right"
          className="w-[300px] sm:w-[400px] flex flex-col"
        >
          <SheetHeader>
            <SheetTitle className="text-left text-2xl text-primary">
              Menu
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-2 ml-4 flex-1">
            {headerLinks.map((link, index) =>
              isLinkGroup(link) ? (
                <MobileNavGroup key={index} group={link} setOpen={setOpen} />
              ) : (
                <MobileNavLink key={index} link={link} setOpen={setOpen} />
              )
            )}
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
  link,
  setOpen,
}: {
  link: HeaderLink
  setOpen: (open: boolean) => void
}) {
  return (
    <Link
      href={link.url}
      className="flex items-center opacity-70 py-2 text-lg hover:text-primary transition-colors"
      onClick={() => setOpen(false)}
    >
      {link.name}
    </Link>
  )
}

function MobileNavGroup({
  group,
  setOpen,
}: {
  group: HeaderLinkItem & { items: HeaderLink[] }
  setOpen: (open: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full opacity-70 py-2 text-lg hover:text-primary transition-colors"
        aria-expanded={expanded}
        aria-controls={`nav-group-${group.name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <span>{group.name}</span>
        {expanded ? (
          <ChevronDown className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </button>

      {expanded && (
        <div
          className="ml-4 pl-2 border-l mt-1 mb-2 space-y-1"
          id={`nav-group-${group.name.toLowerCase().replace(/\s+/g, '-')}`}
          role="region"
        >
          {group.items.map((item, index) => (
            <Link
              key={index}
              href={item.url}
              className="flex items-center opacity-70 py-1.5 text-base hover:text-primary transition-colors"
              onClick={() => setOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
