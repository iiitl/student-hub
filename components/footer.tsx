import React from 'react'
import Link from 'next/link'

const footerLinks = [
  { name: 'GitHub', href: 'https://github.com/iiitl/student-hub/' },
  { name: 'Quick Reads', href: '/quick-reads' },
  { name: 'Chat', href: '/chat' },
  { name: 'Marketplace', href: '/marketplace' },
]

const Footer = () => {
  return (
    <footer className="w-full bg-blue-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 font-satoshi">
      <div className="container mx-auto px-4 py-10 flex flex-col items-center gap-6">
        <nav className="flex flex-wrap justify-center gap-10 w-full">
          {footerLinks.map(link => (
            <Link
              key={link.name}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="text-xl font-semibold tracking-tight text-slate-700 dark:text-blue-100 hover:text-slate-600 dark:hover:text-blue-200 transition-colors duration-200"
              aria-label={link.name}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="w-full h-px bg-slate-300 dark:bg-slate-700 my-4 opacity-60" />
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center tracking-wide">
          &copy; {new Date().getFullYear()} StudentHub. By students, for students. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer
