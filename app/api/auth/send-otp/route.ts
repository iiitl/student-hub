import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import dbConnect from '@/lib/dbConnect'
import OTP from '@/model/OTP'
import { sendOTPVerificationEmail } from '@/lib/mailer'
import validator from 'validator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Basic validation
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase()

    // Validate email format
    if (!validator.isEmail(sanitizedEmail)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate IIITL domain
    if (!sanitizedEmail.endsWith('@iiitl.ac.in')) {
      return NextResponse.json(
        { message: 'Only IIITL email addresses are allowed' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Set expiry to 10 minutes from now
    const expiryDate = new Date(Date.now() + 600000) // 10 minutes from now

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: sanitizedEmail })

    // Create a new OTP document
    await OTP.create({
      email: sanitizedEmail,
      otp,
      expires: expiryDate,
    })

    // Send OTP verification email
    const emailResult = await sendOTPVerificationEmail(sanitizedEmail, otp)

    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error)
      return NextResponse.json(
        { message: 'Failed to send verification email' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'OTP sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending OTP:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 