'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'

export default function SetPassword() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const emailParam = searchParams.get('email')
    const isNew = searchParams.get('new')
    
    if (emailParam) {
      setEmail(emailParam)
    }
    
    if (isNew === 'true') {
      setIsFirstTimeUser(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    // Validate password
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to set password')
      }

      setSuccess(true)
      // Redirect to sign in page after 2 seconds
      setTimeout(() => {
        router.push('/auth/signin')
      }, 2000)
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
          <h2 className="text-center text-2xl font-bold leading-9 tracking-tight mb-2">
            {isFirstTimeUser ? 'Welcome to Student Hub!' : 'Set Your Password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
            {isFirstTimeUser ? (
              <>You've successfully signed in with Google! Set a password to also access your account with email.</>
            ) : (
              <>You previously signed in with Google.<br />Setting a password will allow you to sign in with your email and password.</>
            )}
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-md text-sm">
                Password set successfully! Redirecting to sign in...
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
                  readOnly
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 px-4 py-3 pl-10 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none sm:text-sm bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 mb-1.5"
              >
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 px-4 py-3 pl-10 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none sm:text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium leading-6 mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 px-4 py-3 pl-10 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none sm:text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-gradient-to-r from-primary to-primary/90 px-4 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:from-primary/90 hover:to-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-70 transition-all"
              >
                {loading ? 'Setting password...' : 'Set Password'}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {isFirstTimeUser ? (
              <>
                Or continue to <Link href="/" className="font-semibold leading-6 text-primary hover:text-primary/90">Dashboard</Link>
              </>
            ) : (
              <>
                Return to <Link href="/auth/signin" className="font-semibold leading-6 text-primary hover:text-primary/90">Sign in</Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
} 