'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FcGoogle } from 'react-icons/fc'
import { User, Mail, Lock } from 'lucide-react'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate form
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      // Register the user
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const registerData = await registerResponse.json()

      if (!registerResponse.ok) {
        throw new Error(registerData.message || 'Failed to register')
      }

      // Sign in the user after successful registration
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        throw new Error(result.error || 'Failed to sign in')
      }

      // Redirect to home page
      router.push('/')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' })
  }

  return (
    <div className="flex min-h-[80vh] flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-8">
          <h2 className="text-center text-2xl font-bold leading-9 tracking-tight mb-6">
            Create your account
          </h2>

          <button
            onClick={handleGoogleSignIn}
            className="flex w-full justify-center items-center gap-2 rounded-md bg-white dark:bg-gray-800 px-4 py-3 text-base font-semibold shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            type="button"
          >
            <div className="bg-white p-1 rounded-full">
              <FcGoogle className="h-5 w-5" />
            </div>
            <span className="text-gray-800 dark:text-gray-200">Continue with Google</span>
          </button>

          <div className="mt-6 mb-6 flex items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span className="mx-4 text-gray-500 dark:text-gray-400 text-sm">or sign up with email</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-6 mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 px-4 py-3 pl-10 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none sm:text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

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
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 mb-1.5"
              >
                Password
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
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
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