import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import PasswordReset from '@/model/PasswordReset'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/mailer'
import validator from 'validator'

export async function POST(request: NextRequest) {
  // Parse JSON with error handling
  let email: string
  try {
    const body = await request.json()
    email = body.email
  } catch {
    return NextResponse.json(
      { message: 'Invalid JSON payload' },
      { status: 400 }
    )
  }

  // Validate email
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ message: 'Email is required' }, { status: 400 })
  }

  // Sanitize email
  email = email.trim().toLowerCase()

  // Validate email format using validator
  if (!validator.isEmail(email)) {
    return NextResponse.json(
      { message: 'Invalid email format' },
      { status: 400 }
    )
  }

  // Validate IIITL domain
  if (!email.endsWith('@iiitl.ac.in')) {
    return NextResponse.json(
      { message: 'Only IIITL email addresses are allowed' },
      { status: 400 }
    )
  }

  try {
    await dbConnect()

    // Find user by email
    const user = await User.findOne({ email })

    // For security reasons, don't reveal if a user exists or not
    // Instead, always return a success message

    if (user) {
      // Generate reset token and expiration
      const resetToken = crypto.randomBytes(32).toString('hex')
      const expiryDate = new Date(Date.now() + 3600000) // 1 hour from now

      // Hash the token for security
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')

      // Delete any existing reset tokens for this email
      await PasswordReset.deleteMany({ email })

      // Create a new password reset document
      await PasswordReset.create({
        email,
        token: hashedToken,
        expires: expiryDate,
      })

      // Send password reset email
      const emailResult = await sendPasswordResetEmail(email, resetToken)

      if (!emailResult.success) {
        console.error('Failed to send password reset email:', emailResult.error)
        // Log detailed error for monitoring
        const errorDetails = {
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Partial redaction for privacy
          error: emailResult.error,
          timestamp: new Date().toISOString(),
        }
        console.error(
          'Password reset email failure:',
          JSON.stringify(errorDetails)
        )
      }
    }

    // Always return success for security
    return NextResponse.json(
      {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
