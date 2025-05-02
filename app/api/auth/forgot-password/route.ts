import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import PasswordReset from '@/model/PasswordReset'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/mailer'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    
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
      await PasswordReset.deleteMany({ email: email.toLowerCase() })
      
      // Create a new password reset document
      await PasswordReset.create({
        email: email.toLowerCase(),
        token: hashedToken,
        expires: expiryDate
      })
      
      // Send password reset email
      const emailResult = await sendPasswordResetEmail(email, resetToken)
      
      // For development purposes, log the token (remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.log(`Reset token for ${email}: ${resetToken}`)
        console.log(`Reset link: ${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`)
      }
      
      if (!emailResult.success) {
        console.error('Failed to send password reset email:', emailResult.error)
      }
    }
    
    // Always return success for security
    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in forgot password:', error)
    return NextResponse.json(
      { message: 'An error occurred while processing your request.' },
      { status: 500 }
    )
  }
} 