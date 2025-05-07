import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Define paths that should be protected for admins
const ADMIN_PATHS = ['/admin', '/api/admin']

export async function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const path = request.nextUrl.pathname

  // Check if this is an admin route that needs protection
  const isAdminRoute = ADMIN_PATHS.some(route => path.startsWith(route))

  if (isAdminRoute) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // No token or no user
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if the user has the admin role
    const userRoles = token.roles as string[] || []
    if (!userRoles.includes('admin')) {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
} 