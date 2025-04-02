import Link from 'next/link'
import React from 'react'
import MobileNav from '@/components/mobile-nav'
import ThemeToggle from './theme-toggler'
import { headerLinks } from '@/data/header-links'

const Header = () => {
  return (
    <header className="border-b sticky top-0 text-foreground bg-background z-40">
      <div className="container mx-auto px-4 py-5 flex justify-between items-center">
        <Link href="/" className="font-extrabold text-2xl ">
          Student<span className="text-primary">Hub</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 bg-blue">
          {headerLinks.map((link, index) => (
            <Link
              key={index}
              href={link.url}
              className="text-sm hover:text-primary transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        {/* Mobile Navigation Trigger */}
        <MobileNav />
      </div>
    </header>
  )
}

export default Header
