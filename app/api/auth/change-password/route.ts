import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '../[...nextauth]/options'
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'
import { validatePassword } from '@/lib/validation'

// Remove edge runtime since bcrypt and mongoose aren't edge-compatible

// 5 requests per hour per IP
const resetPasswordLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '1h'),
})

export async function POST(request: NextRequest) {
  try {
    // Identify client IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() || // may be a list
      request.headers.get('x-real-ip') ||
      'unknown'

    // Apply rate limit
    if (process.env.NODE_ENV === 'production') {
      const { success } = await resetPasswordLimiter.limit(
        `reset-password_${ip}`
      )
      if (!success) {
        return NextResponse.json(
          { message: 'Too many requests, please try again later.' },
          { status: 429 }
        )
      }
    }

    // Get the current authenticated user from session
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { currentPassword, newPassword } = await request.json()

    // Basic validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Find user by email from session
    const user = await User.findOne({ email: session.user.email.toLowerCase() })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Handle users who signed up with Google but haven't set a password yet
    if (!user.passwordSet || !user.password) {
      // Validate password complexity
      const passwordError = validatePassword(newPassword)
      if (passwordError) {
        return NextResponse.json({ message: passwordError }, { status: 400 })
      }

      // For Google-only users, just set the new password without checking the current one
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      user.password = hashedPassword
      user.passwordSet = true
      await user.save()

      return NextResponse.json(
        { message: 'Password set successfully' },
        { status: 200 }
      )
    }

    // Verify current password
    const isCorrectPassword = await bcrypt.compare(
      currentPassword,
      user.password
    )

    if (!isCorrectPassword) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    user.passwordSet = true
    await user.save()

    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
