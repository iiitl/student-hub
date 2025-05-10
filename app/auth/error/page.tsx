import { Suspense } from 'react'
import AuthErrorContent from './auth-error-content'

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-[80vh] flex-col justify-center px-6 py-12 lg:px-8"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="animate-pulse" role="status">
              <div className="h-12 bg-red-100 dark:bg-red-900/20 rounded mb-4"></div>
              <div className="h-24 bg-red-50 dark:bg-red-900/10 rounded"></div>
              <span className="sr-only">
                Loading authentication error content...
              </span>
            </div>
          </div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  )
}
