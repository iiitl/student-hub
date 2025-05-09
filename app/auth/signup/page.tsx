'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FcGoogle } from 'react-icons/fc'
import { User, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  validatePassword,
  validateEmail,
  validateOTP,
  validateName,
  validatePasswordsMatch,
} from '@/lib/validation'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const router = useRouter()

  const handleSendOTP = async () => {
    setOtpLoading(true)
    setError('')

    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      setOtpLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP')
      }

      setOtpSent(true)
      setError('')
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to send OTP. Please try again.'
      setError(errorMessage)
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    setOtpLoading(true)
    setError('')

    const otpError = validateOTP(otp)
    if (otpError) {
      setError(otpError)
      setOtpLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify OTP')
      }

      setOtpVerified(true)
      setError('')
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Invalid OTP. Please try again.'
      setError(errorMessage)
    } finally {
      setOtpLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate form
    const nameError = validateName(name)
    if (nameError) {
      setError(nameError)
      setLoading(false)
      return
    }

    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      setLoading(false)
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      setLoading(false)
      return
    }

    const passwordsMatchError = validatePasswordsMatch(
      password,
      confirmPassword
    )
    if (passwordsMatchError) {
      setError(passwordsMatchError)
      setLoading(false)
      return
    }

    if (!otpVerified) {
      setError('Please verify your email with OTP first')
      setLoading(false)
      return
    }

    try {
      // Register the user with the combined endpoint
      const registerResponse = await fetch('/api/auth/register-with-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          otp,
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      await signIn('google', { callbackUrl: '/' })
    } catch {
      setError('Failed to sign in with Google. Please try again.')
      setLoading(false)
    }
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
            disabled={loading}
          >
            <div className="bg-white p-1 rounded-full">
              <FcGoogle className="h-5 w-5" />
            </div>
            <span className="text-gray-800 dark:text-gray-200">
              Continue with Google
            </span>
          </button>

          <div className="mt-6 mb-6 flex items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span className="mx-4 text-gray-500 dark:text-gray-400 text-sm">
              or sign up with email
            </span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-md text-sm">
                <div className="flex gap-2 items-start">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
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
              <div className="flex items-start gap-2">
                <div className="relative flex-grow">
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
                    placeholder="you@iiitl.ac.in"
                    disabled={otpVerified}
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-700 px-4 py-3 pl-10 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none sm:text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                {!otpVerified ? (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={otpLoading || !email || otpSent}
                    className="whitespace-nowrap px-4 py-3 text-sm font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {otpLoading
                      ? 'Sending...'
                      : otpSent
                        ? 'OTP Sent'
                        : 'Send OTP'}
                  </button>
                ) : (
                  <div className="flex items-center text-green-600 dark:text-green-400 px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 mr-1" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                )}
              </div>
            </div>

            {otpSent && !otpVerified && (
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium leading-6 mb-1.5"
                >
                  Enter OTP
                </label>
                <div className="flex items-start gap-2">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => {
                      // Only allow digits and limit to 6 characters
                      const value = e.target.value
                        .replace(/[^0-9]/g, '')
                        .slice(0, 6)
                      setOtp(value)
                    }}
                    placeholder="123456"
                    maxLength={6}
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-700 px-4 py-3 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none sm:text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                    // Only allow numbers
                    onKeyPress={(e) => {
                      if (!/\d/.test(e.key)) {
                        e.preventDefault()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otpLoading || !otp || otp.length < 6}
                    className="whitespace-nowrap px-4 py-3 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {otpLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
                <div className="mt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={otpLoading}
                    className="text-primary hover:text-primary/80 text-sm flex items-center"
                  >
                    <span>Resend OTP</span>
                  </button>
                  <span className="text-sm text-gray-500">
                    OTP valid for 10 minutes
                  </span>
                </div>
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <p>Having trouble with OTP verification?</p>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>
                      Make sure you&lsquo;re entering the 6-digit code sent to
                      your email
                    </li>
                    <li>
                      Check your spam/junk folder if you don&lsquo;t see the
                      email
                    </li>
                    <li>Click &ldquo;Resend OTP&rdquo; to get a new code</li>
                  </ul>
                </div>
              </div>
            )}

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
                disabled={loading || !otpVerified}
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
