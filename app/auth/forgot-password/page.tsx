'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process request')
      }

      setSuccess(true)
      setEmail('')
    } catch (error: any) {
      setError(error.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-8">
          <h2 className="text-center text-2xl font-bold leading-9 tracking-tight mb-6">
            Reset your password
          </h2>

          {!success ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium leading-6 mb-1.5"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-700 px-4 py-3 pl-10 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none sm:text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  We'll send you an email with a link to reset your password.
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-md bg-gradient-to-r from-primary to-primary/90 px-4 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:from-primary/90 hover:to-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-70 transition-all"
                >
                  {loading ? 'Processing...' : 'Reset Password'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-md mb-6">
                Password reset link sent! Check your email for instructions.
              </div>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                If you don't see the email, check your spam folder or try again.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="flex w-full justify-center rounded-md bg-primary/10 dark:bg-primary/20 px-4 py-3 text-sm font-semibold leading-6 text-primary hover:bg-primary/20 dark:hover:bg-primary/30 transition-all"
              >
                Try Again
              </button>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Remember your password?{' '}
            <Link
              href="/auth/signin"
              className="font-semibold leading-6 text-primary hover:text-primary/90"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 