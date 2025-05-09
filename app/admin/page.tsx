'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { UserCog, Users } from 'lucide-react'

export default function AdminDashboard() {
  const { data: session } = useSession()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">
          Welcome, {session?.user?.name || 'Admin'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This is the admin area where you can manage your Student Hub
          application.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/users"
            className="flex items-start p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-medium">User Management</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View and manage user accounts, assign admin roles
              </p>
            </div>
          </Link>

          <div className="flex items-start p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <UserCog className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-medium">Settings</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                App configuration and settings (coming soon)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
