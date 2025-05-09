'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { isAdmin } from '@/lib/auth-utils'
import { Loader2, Shield, ShieldOff, UserCog } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  roles: string[]
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/roles')
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `Error: ${response.status}`)
        }
        const data = await response.json()
        if (!data.users || !Array.isArray(data.users)) {
          throw new Error('Invalid response format')
        }
        setUsers(data.users)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch users. You may not have admin privileges.'
        )
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      if (isAdmin(session)) {
        fetchUsers()
      } else {
        setError('You do not have permission to access this page')
        setLoading(false)
      }
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/users')
    }
  }, [session, status, router])

  // Handle role change (promote/demote)
  const handleRoleChange = async (
    userId: string,
    action: 'promote' | 'demote'
  ) => {
    setActionLoading(userId)
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error: ${response.status}`)
      }

      const data = await response.json()

      // Update the users state with the updated user
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, roles: data.user.roles } : user
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <UserCog className="h-6 w-6" />
        <h1 className="text-2xl font-bold">User Management</h1>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No users found
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className={`px-2 py-1 text-xs rounded-full ${
                            role === 'admin'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500'
                          }`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {user.roles.includes('admin') ? (
                      <button
                        onClick={() => handleRoleChange(user.id, 'demote')}
                        disabled={actionLoading === user.id}
                        className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 inline-flex items-center gap-1"
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ShieldOff className="h-4 w-4" />
                        )}
                        <span>Revoke Admin</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRoleChange(user.id, 'promote')}
                        disabled={actionLoading === user.id}
                        className="text-green-600 hover:text-green-900 dark:text-green-500 dark:hover:text-green-400 inline-flex items-center gap-1"
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                        <span>Make Admin</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
