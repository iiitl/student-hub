import { NextRequest, NextResponse } from 'next/server'
import { verifyJwt } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const verification = await verifyJwt(request)

    if (!verification.verified) {
      return NextResponse.json(
        { isAdmin: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if the user has the admin role
    const hasAdminRole = verification.roles?.includes('admin') || false

    return NextResponse.json({
      isAdmin: hasAdminRole,
      message: hasAdminRole 
        ? 'User has admin privileges' 
        : 'User does not have admin privileges'
    })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json(
      { isAdmin: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 