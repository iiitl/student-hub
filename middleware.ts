import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'
import { isKnownBot } from './lib/security'

// Check if rate limiting should be enabled
const isRateLimitingEnabled = () => {
  return (
    process.env.NODE_ENV === 'production' &&
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  )
}

// Rate limiters for different operations
const createRateLimiters = () => {
  if (!isRateLimitingEnabled()) return null

  return {
    signIn: new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
    }),
    signUp: new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: true,
    }),
    otp: new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
    }),
    passwordReset: new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: true,
    }),
    passwordChange: new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      analytics: true,
    }),
  }
}

// Create rate limiters only if enabled
const rateLimiters = createRateLimiters()

// Map API paths to their respective rate limiters
const rateLimiterMap = rateLimiters
  ? {
      '/api/auth/signin': rateLimiters.signIn,
      '/api/auth/register': rateLimiters.signUp,
      '/api/auth/otp': rateLimiters.otp,
      '/api/auth/reset-password': rateLimiters.passwordReset,
      '/api/auth/forgot-password': rateLimiters.passwordReset,
      '/api/auth/change-password': rateLimiters.passwordChange,
    }
  : {}

// Maximum request size (10MB)
const MAX_REQUEST_SIZE = 10 * 1024 * 1024

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const userAgent = request.headers.get('user-agent') || ''

  // Block known bots
  if (isKnownBot(userAgent)) {
    return NextResponse.json({ message: 'Access denied' }, { status: 403 })
  }

  // Check request size
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
    return NextResponse.json({ message: 'Request too large' }, { status: 413 })
  }

  // Check if the path needs rate limiting
  const limiter = rateLimiterMap[path as keyof typeof rateLimiterMap]
  if (limiter && isRateLimitingEnabled()) {
    // Get client IP from headers or default to localhost
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') || // Cloudflare
      request.headers.get('true-client-ip') || // Akamai and Cloudflare
      '127.0.0.1'

    try {
      const { success, limit, reset, remaining } = await limiter.limit(ip)

      if (!success) {
        // Check if this is an API request or a page request
        const isApiRequest = path.startsWith('/api/')

        if (isApiRequest) {
          return new NextResponse(
            JSON.stringify({
              error: 'Too many requests',
              limit,
              reset,
              remaining,
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': reset.toString(),
              },
            }
          )
        } else {
          // For page routes, redirect to a rate limit page with retry-after header
          return NextResponse.redirect(new URL('/rate-limited', request.url), {
            headers: {
              'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          })
        }
      }
    } catch (error) {
      console.error('Rate limiting error:', error)
      // Continue with the request if rate limiting fails
    }
  }

  // Check authentication for protected routes
  if (path.startsWith('/api/') && !path.startsWith('/api/auth/')) {
    const token = await getToken({ req: request })
    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      })
    }
  }

  // Check admin access for admin routes
  if (path.startsWith('/api/admin/') || path.startsWith('/admin/')) {
    const token = await getToken({ req: request })
    if (
      !token ||
      !Array.isArray(token.roles) ||
      !token.roles.includes('admin')
    ) {
      // For page routes, redirect to access denied page
      if (path.startsWith('/admin/')) {
        return NextResponse.redirect(new URL('/', request.url))
      }
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
      })
    }
  }

  // Add security headers
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  )
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  return response
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
}
