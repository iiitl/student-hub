'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  Mail,
  LogOut,
  Settings,
  AlertCircle,
  ShieldCheck,
  UserPlus,
  Trash2,
  Loader2,
  Crown,
} from 'lucide-react'
import Image from 'next/image'

const SUPER_ADMIN_EMAIL = 'technicalclub@iiitl.ac.in'

type AdminUser = {
  id: string
  name: string
  email: string
  roles: string[]
}

export default function Profile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [passwordSet, setPasswordSet] = useState<boolean | null>(null)

  // Admin management state
  const [adminEmail, setAdminEmail] = useState('')
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminMessage, setAdminMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [liveRoles, setLiveRoles] = useState<string[]>([])

  const isUserAdmin =
    liveRoles.includes('admin') ||
    (Array.isArray(session?.user?.roles) &&
      session!.user!.roles!.includes('admin')) ||
    session?.user?.email === SUPER_ADMIN_EMAIL

  const isSuperAdmin = session?.user?.email === SUPER_ADMIN_EMAIL

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
          const params = new URLSearchParams({
            email: session.user?.email as string,
          })
          const response = await fetch(`/api/user/password-status?${params}`)
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

  // Fetch live roles
  useEffect(() => {
    if (session?.user?.email && status === 'authenticated') {
      const fetchRoles = async () => {
        try {
          const response = await fetch('/api/user/roles')
          if (response.ok) {
            const data = await response.json()
            setLiveRoles(data.roles || [])
          }
        } catch (error) {
          console.error('Error fetching live roles:', error)
        }
      }
      fetchRoles()
    }
  }, [session, status])

  // Fetch admin list
  const fetchAdmins = useCallback(async () => {
    setLoadingAdmins(true)
    try {
      const response = await fetch('/api/admin/list')
      if (response.ok) {
        const data = await response.json()
        setAdmins(data.admins)
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
    } finally {
      setLoadingAdmins(false)
    }
  }, [])

  useEffect(() => {
    if (isUserAdmin) {
      fetchAdmins()
    }
  }, [isUserAdmin, fetchAdmins])

  // Add admin by email
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminEmail.trim()) return

    setAdminLoading(true)
    setAdminMessage(null)

    try {
      const response = await fetch('/api/admin/add-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setAdminMessage({ type: 'success', text: data.message })
        setAdminEmail('')
        fetchAdmins()
      } else {
        setAdminMessage({
          type: 'error',
          text: data.message || 'Failed to add admin',
        })
      }
    } catch {
      setAdminMessage({ type: 'error', text: 'Failed to add admin' })
    } finally {
      setAdminLoading(false)
    }
  }

  // Remove admin by email
  const handleRemoveAdmin = async (email: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" as admin?`)) return

    setAdminLoading(true)
    setAdminMessage(null)

    try {
      const response = await fetch('/api/admin/remove-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setAdminMessage({ type: 'success', text: data.message })
        fetchAdmins()
      } else {
        setAdminMessage({
          type: 'error',
          text: data.message || 'Failed to remove admin',
        })
      }
    } catch {
      setAdminMessage({ type: 'error', text: 'Failed to remove admin' })
    } finally {
      setAdminLoading(false)
    }
  }

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
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold">{session.user?.name}</h2>
              {isUserAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
                  <ShieldCheck className="h-3 w-3" />
                  Admin
                </span>
              )}
            </div>
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

        <div className="bg-background rounded-lg shadow-md p-6 mb-8">
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

        {/* Admin Management Section - Only visible to super-admin */}
        {isSuperAdmin && (
          <div className="bg-background rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-6">
              <Crown className="h-5 w-5 text-amber-500" />
              <h3 className="text-xl font-semibold">Admin Management</h3>
            </div>

            {/* Add Admin Form */}
            <form onSubmit={handleAddAdmin} className="mb-6">
              <label
                htmlFor="admin-email"
                className="block text-sm font-medium mb-2"
              >
                Add a new admin by email
              </label>
              <div className="flex gap-2">
                <input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Enter email address (e.g. user@iiitl.ac.in)"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={adminLoading}
                />
                <button
                  type="submit"
                  disabled={adminLoading || !adminEmail.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {adminLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Add Admin
                </button>
              </div>
            </form>

            {/* Status message */}
            {adminMessage && (
              <div
                className={`mb-4 px-4 py-3 rounded-md text-sm ${
                  adminMessage.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30'
                }`}
              >
                {adminMessage.text}
              </div>
            )}

            {/* Admin List */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Current Admins
              </h4>
              {loadingAdmins ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : admins.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No admins found</p>
              ) : (
                <div className="space-y-2">
                  {admins.map((admin) => {
                    const isSuperAdmin = admin.email === SUPER_ADMIN_EMAIL
                    const isSelf = admin.email === session.user?.email
                    return (
                      <div
                        key={admin.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {admin.name
                              ? admin.name
                                  .split(' ')
                                  .map((n: string) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .substring(0, 2)
                              : 'A'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {admin.name}
                              </p>
                              {isSuperAdmin && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                                  <Crown className="h-2.5 w-2.5" />
                                  Super Admin
                                </span>
                              )}
                              {isSelf && (
                                <span className="text-[10px] text-gray-400">
                                  (you)
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {admin.email}
                            </p>
                          </div>
                        </div>
                        {!isSuperAdmin && !isSelf && (
                          <button
                            onClick={() =>
                              handleRemoveAdmin(admin.email, admin.name)
                            }
                            disabled={adminLoading}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                            title={`Remove ${admin.name} as admin`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
