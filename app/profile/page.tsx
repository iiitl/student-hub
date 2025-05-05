'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, LogOut, Settings, AlertCircle } from 'lucide-react'
import Image from 'next/image'

export default function Profile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [passwordSet, setPasswordSet] = useState<boolean | null>(null)

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/profile')
    }
  }, [status, router])

  // Check if the user has a password set
  useEffect(() => {
    if (session?.user?.email) {
      const checkPasswordStatus = async () => {
        try {
          const response = await fetch(
            `/api/user/password-status?email=${encodeURIComponent(session.user?.email as string)}`
          )
          if (response.ok) {
            const data = await response.json()
            setPasswordSet(data.passwordSet)
          }
        } catch (error) {
          console.error('Error checking password status:', error)
        }
      }

      checkPasswordStatus()
    }
  }, [session])

  if (status === 'loading') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-24 w-24 rounded-full bg-gray-200 mx-auto mb-4"></div>
          <div className="h-8 w-48 bg-gray-200 mx-auto mb-2 rounded"></div>
          <div className="h-4 w-64 bg-gray-200 mx-auto rounded"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Handled by the redirect in useEffect
  }

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-8 mb-8">
        <h1 className="text-3xl font-bold mb-8 text-center">My Profile</h1>

        {passwordSet === false && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 px-6 py-4 rounded-md mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">
                Your account doesn&apos;t have a password set
              </p>
              <p className="text-sm mt-1">
                You&apos;re currently signed in with Google, but you can also
                set a password to access your account with email and password.
              </p>
              <Link
                href={`/auth/set-password?email=${encodeURIComponent(session.user?.email || '')}`}
                className="mt-2 inline-flex items-center text-sm font-medium text-primary hover:text-primary/80"
              >
                Set password <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        )}

        <div className="bg-background rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col items-center mb-6">
            {session.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                width={96}
                height={96}
                className="rounded-full mb-4 border-4 border-primary/20 object-cover"
                unoptimized
              />
            ) : (
              <div className="h-24 w-24 bg-gradient-to-br from-primary to-primary/80 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 shadow-md">
                {session.user?.name ? getInitials(session.user.name) : 'U'}
              </div>
            )}
            <h2 className="text-2xl font-semibold">{session.user?.name}</h2>
            <p className="text-gray-500">{session.user?.email}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center p-4 bg-muted/30 rounded-md">
              <User className="h-5 w-5 mr-3 text-primary" />
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-gray-600 dark:text-gray-300">
                  {session.user?.name}
                </p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-muted/30 rounded-md">
              <Mail className="h-5 w-5 mr-3 text-primary" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-gray-600 dark:text-gray-300">
                  {session.user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-background rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Account Settings</h3>

          <div className="space-y-4">
            {passwordSet ? (
              <Link
                href="/auth/change-password"
                className="flex justify-between items-center p-4 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="mr-3 h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Change Password</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Update your account password
                    </p>
                  </div>
                </div>
              </Link>
            ) : (
              <Link
                href={`/auth/set-password?email=${encodeURIComponent(session.user?.email || '')}`}
                className="flex justify-between items-center p-4 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="mr-3 h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Set Password</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Set a password for email login
                    </p>
                  </div>
                </div>
              </Link>
            )}

            <button
              onClick={handleSignOut}
              className="w-full flex justify-between items-center p-4 bg-red-50/30 dark:bg-red-900/20 rounded-md hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center">
                <div className="mr-3 h-10 w-10 rounded-full bg-red-100 dark:bg-red-800/60 flex items-center justify-center">
                  <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-red-600 dark:text-red-400 text-left">
                    Sign Out
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sign out from your account
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
