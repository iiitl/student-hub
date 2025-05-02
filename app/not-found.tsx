'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const { status } = useSession()
  
  const isAuthenticated = status === 'authenticated'

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-gray-600 max-w-md mb-8">
        We couldn't find the page you're looking for. The page might have been moved, deleted, or never existed.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full max-w-md">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          <Home size={18} />
          Back to Home
        </Link>
        
        <Link
          href="javascript:history.back()"
          className="flex items-center justify-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={18} />
          Go Back
        </Link>
      </div>
      
      {!isAuthenticated && (
        <div className="border-t border-gray-200 pt-6 w-full max-w-md">
          <p className="text-gray-600 mb-4">
            Looking for your account?
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/auth/signin"
              className="flex-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200 transition-colors"
            >
              Sign In
            </Link>
            
            <Link
              href="/auth/signup"
              className="flex-1 rounded-md bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
