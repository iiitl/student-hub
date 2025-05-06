'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function AuthErrorContent() {
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string>(
    'An error occurred during authentication.'
  )

  useEffect(() => {
    const error = searchParams.get('error') || ''

    const messages: Record<string, string> = {
      OAuthSignin:
        'There was a problem with the Google sign-in process. Please try again.',
      OAuthCallback:
        'There was a problem with the Google sign-in process. Please try again.',
      OAuthAccountNotLinked:
        'This email is already associated with another account using a different sign-in method.',
      EmailSignin:
        'There was a problem sending the email for sign-in. Please try again.',
      CredentialsSignin:
        'The email or password you entered is incorrect. Please try again.',
      SessionRequired: 'You need to be signed in to access this page.',
      PASSWORD_NOT_SET:
        'You need to set a password for your account. You previously signed in with Google.',
    }

    setErrorMessage(
      messages[error] ?? 'An error occurred during authentication.'
    )
  }, [searchParams])

  return (
    <div className="flex min-h-[80vh] flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6"
        >
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p>{errorMessage}</p>
        </div>

        <div className="flex flex-col gap-4 mt-6">
          <Link
            href="/auth/signin"
            className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold leading-6 text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Back to Sign In
          </Link>

          <Link
            href="/"
            className="flex w-full justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold leading-6 text-gray-900 shadow-sm hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
