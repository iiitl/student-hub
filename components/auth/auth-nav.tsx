'use client'

import dynamic from 'next/dynamic'

// Dynamically import AuthButton to prevent hydration errors
const AuthButton = dynamic(() => import('@/components/auth/auth-button'), {
  ssr: false,
})

export default function AuthNav() {
  return <AuthButton />
} 