'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { isAdmin } from '@/lib/auth-utils'
import { Loader2, Users, Settings, ShieldAlert, ChevronRight } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      if (!isAdmin(session)) {
        router.push('/')
        return
      }
      setLoading(false)
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin')
    }
  }, [session, status, router])

  if (loading || status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Navigation links for admin area
  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: <Settings className="h-4 w-4" /> },
    { href: '/admin/users', label: 'User Management', icon: <Users className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin header */}
      <header className="bg-primary text-white py-4 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-6 w-6" />
            <h1 className="text-xl font-bold">Admin Area</h1>
          </div>
          <Link 
            href="/"
            className="text-sm bg-white/20 px-3 py-1 rounded hover:bg-white/30 transition-colors"
          >
            Return to Site
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar navigation */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          isActive
                            ? 'bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary font-medium border-l-4 border-primary'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {link.icon}
                          <span>{link.label}</span>
                        </div>
                        {isActive && <ChevronRight className="h-4 w-4" />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
} 