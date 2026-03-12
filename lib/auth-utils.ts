import { Session } from 'next-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Check if the user has the admin role in their session
 */
export function isAdmin(session: Session | null): boolean {
  const roles = Array.isArray(session?.user?.roles) ? session!.user!.roles : []
  return roles.includes('admin')
}

/**
 * Middleware helper to check admin role in the token
 */
export async function verifyAdminApi(
  request: NextRequest,
  requireSuperAdmin: boolean = false
) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // No token or no user
  if (!token) {
    return NextResponse.json(
      { message: 'Unauthorized', success: false },
      { status: 401 }
    )
  }

  // Check if the user has the admin role or is the super admin
  const userRoles = (token.roles as string[]) || []
  const isSuperAdmin = token.email === 'technicalclub@iiitl.ac.in'

  if (requireSuperAdmin && !isSuperAdmin) {
    return NextResponse.json(
      { message: 'Forbidden - Super Admin access required', success: false },
      { status: 403 }
    )
  }

  if (!requireSuperAdmin && !userRoles.includes('admin') && !isSuperAdmin) {
    return NextResponse.json(
      { message: 'Forbidden - Admin access required', success: false },
      { status: 403 }
    )
  }

  return NextResponse.json(
    {
      message: 'Authorized as admin',
      success: true,
      userId: token.sub,
      email: token.email,
    },
    { status: 200 }
  )
}

/**
 * Function to decode JWT token and verify its integrity
 * This is more secure than simply parsing the token
 */
export async function verifyJwt(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      return NextResponse.json(
        { verified: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      verified: true,
      token,
      userId: token.sub,
      roles: (token.roles as string[]) || [],
    })
  } catch {
    return NextResponse.json(
      { verified: false, message: 'Token verification failed' },
      { status: 401 }
    )
  }
}
