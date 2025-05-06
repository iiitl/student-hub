import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import PasswordReset from '@/model/PasswordReset'
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'
import { validatePassword } from '@/lib/validation'

// Remove edge runtime since bcrypt and mongoose aren't edge-compatible

// 5 requests per minute per IP
const resetPasswordLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '1m'),
})

export async function POST(request: NextRequest) {
  // Identify client IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() || // may be a list
    request.headers.get('x-real-ip') ||
    'unknown'

  // Apply rate limit
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  ) {
    const { success } = await resetPasswordLimiter.limit(`reset-password_${ip}`)
    if (!success) {
      return NextResponse.json(
        { message: 'Too many requests, please try again later.' },
        { status: 429 }
      )
    }
  }

  try {
    await dbConnect()

    const { token, password } = await request.json()

    // Validate inputs
    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Password validation
    const passwordError = validatePassword(password)
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 })
    }

    // Hash the token to compare with stored value
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // Find token document and check expiry
    const resetRequest = await PasswordReset.findOne({
      token: hashedToken,
      expires: { $gt: new Date() }, // Token must not be expired
    })

    if (!resetRequest) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    // Find the user by email
    const user = await User.findOne({ email: resetRequest.email })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user with new password
    user.password = hashedPassword
    user.passwordSet = true
    await user.save()

    // Delete all password reset tokens for this user
    await PasswordReset.deleteMany({ email: resetRequest.email })

    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    )
  } catch (error) {
    // Log detailed error in development, sanitized version in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Error resetting password:', error)
    } else {
      console.error('Error resetting password. Check server logs for details.')
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
