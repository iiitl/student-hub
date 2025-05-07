import { Session } from 'next-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Check if the user has the admin role in their session
 */
export function isAdmin(session: Session | null): boolean {
  if (!session?.user?.roles) return false
  return session.user.roles.includes('admin')
}

/**
 * Middleware helper to check admin role in the token
 */
export async function verifyAdminApi(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // No token or no user
  if (!token) {
    return {
      status: 401,
      message: 'Unauthorized',
      success: false
    }
  }

  // Check if the user has the admin role
  const userRoles = token.roles as string[] || []
  if (!userRoles.includes('admin')) {
    return {
      status: 403,
      message: 'Forbidden - Admin access required',
      success: false
    }
  }

  return {
    status: 200,
    message: 'Authorized as admin',
    success: true,
    userId: token.sub
  }
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
      return {
        verified: false,
        message: 'Invalid token'
      }
    }
    
    return {
      verified: true,
      token,
      userId: token.sub,
      roles: token.roles as string[] || []
    }
  } catch (error) {
    return {
      verified: false, 
      message: 'Token verification failed'
    }
  }
} 