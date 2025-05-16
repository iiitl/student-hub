'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { LogOut, User, ShieldAlert } from 'lucide-react'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isAdmin } from '@/lib/auth-utils'

export default function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/signin"
          className="text-sm hover:text-primary transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm hover:bg-primary/90 transition-colors"
        >
          Sign up
        </Link>
      </div>
    )
  }

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const userIsAdmin = isAdmin(session)

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 focus:outline-none">
            {session?.user?.image ? (
              // Display Google profile picture if available
              <Image
                src={session.user.image}
                alt={session.user.name || 'User avatar'}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
                unoptimized
              />
            ) : (
              // Fallback to initials if no profile picture
              <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {session?.user?.name ? getInitials(session.user.name) : 'U'}
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex flex-col px-2 py-1.5">
            <p className="text-sm font-medium">{session?.user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {session?.user?.email}
            </p>
            {userIsAdmin && (
              <span className="mt-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 px-1.5 py-0.5 rounded-full self-start">
                Admin
              </span>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer flex items-center">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>

          {userIsAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/admin"
                  className="cursor-pointer flex items-center text-yellow-700 dark:text-yellow-500"
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </Link>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: '/' })}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
