import Link from 'next/link'
import React from 'react'
import MobileNav from '@/components/mobile-nav'
import ThemeToggle from './theme-toggler'
import { headerLinks, isLinkGroup } from '@/data/header-links'
import AuthNav from '@/components/auth/auth-nav'
import NavDropdown from '@/components/nav-dropdown'

const Header = () => {
  return (
    <header className="sticky top-0 z-40 bg-blue-100/60 dark:bg-slate-800/60 backdrop-blur-xl border-b border-white/20 shadow-md font-satoshi text-foreground">
      <div className="container mx-auto px-4 py-5 flex justify-between items-center">
        <Link href="/" className="font-extrabold text-2xl">
          Student<span className="text-primary">Hub</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {headerLinks.map((link) =>
            isLinkGroup(link) ? (
              <NavDropdown key={link.name} group={link} />
            ) : (
              <Link
                key={link.name}
                href={link.url}
                className="text-sm hover:text-primary transition-colors"
              >
                {link.name}
              </Link>
            )
          )}
          <ThemeToggle />
          <AuthNav />
        </nav>

        {/* Mobile Navigation Trigger */}
        <MobileNav />
      </div>
    </header>
  )
}

export default Header
