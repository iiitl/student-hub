export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordResetEmail } from '@/lib/email'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import PasswordReset from '@/model/PasswordReset'
import { hashSensitiveData } from '@/lib/security'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    await dbConnect()

    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      // Return success even if user doesn't exist for security
      return NextResponse.json(
        {
          message: 'If an account exists, a password reset email will be sent',
        },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = await hashSensitiveData(resetToken)
    const resetTokenExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now

    // Delete any existing reset requests for this email
    await PasswordReset.deleteMany({ email: user.email })

    // Create new password reset document
    const resetDoc = await PasswordReset.create({
      email: user.email,
      token: hashedToken,
      expires: resetTokenExpiry,
      used: false,
      attempts: 0,
    })

    // Send email
    try {
      await sendPasswordResetEmail(user.email, resetToken)
    } catch (emailError) {
      // Delete the reset document if email fails
      await PasswordReset.deleteOne({ _id: resetDoc._id })
      throw emailError
    }

    return NextResponse.json(
      { message: 'If an account exists, a password reset email will be sent' },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Password reset request failed:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return NextResponse.json(
      { message: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
