import { Suspense } from 'react'
import SetPasswordForm from './set-password-form'

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 mx-auto mb-2 rounded"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 mx-auto rounded"></div>
          </div>
        </div>
      }
    >
      <SetPasswordForm />
    </Suspense>
  )
}
