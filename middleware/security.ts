import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

// Rate limiters for different operations
const signInLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
})

const signUpLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
})

const otpLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
})

const passwordResetLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
})

const passwordChangeLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: true,
})

// Map API paths to their respective rate limiters
const rateLimiters = {
  '/api/auth/signin': signInLimiter,
  '/api/auth/register': signUpLimiter,
  '/api/auth/otp': otpLimiter,
  '/api/auth/send-otp': otpLimiter,
  '/api/auth/verify-otp': otpLimiter,
  '/api/auth/reset-password': passwordResetLimiter,
  '/api/auth/change-password': passwordChangeLimiter,
  '/api/auth/set-password': passwordChangeLimiter,
}

// Maximum request size (10MB)
const MAX_REQUEST_SIZE = 10 * 1024 * 1024

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Check request size
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
    return new NextResponse(JSON.stringify({ error: 'Request too large' }), {
      status: 413,
    })
  }

  // Check if the path needs rate limiting
  const limiter = rateLimiters[path as keyof typeof rateLimiters]
  if (limiter) {
    // Get client IP from headers or default to localhost
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'

    try {
      const { success, limit, reset, remaining } = await limiter.limit(ip)

      if (!success) {
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
      }
    } catch (error) {
      console.error('Rate limiting error:', error)
      // Continue with the request if rate limiting fails
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
  matcher: ['/api/:path*'],
}
