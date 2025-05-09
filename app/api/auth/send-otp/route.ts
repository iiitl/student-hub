import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import OTP from '@/model/OTP'
import { generateSecureToken } from '@/lib/security'
import { sendEmail } from '@/lib/email'
import { validateEmail } from '@/lib/validation'

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

    // Validate email
    const emailError = validateEmail(email)
    if (emailError) {
      return NextResponse.json({ message: emailError }, { status: 400 })
    }

    // Get user agent and IP address from request headers
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'Unknown'

    // Generate a 6-digit OTP
    const otp = await generateSecureToken(3) // This will give us 6 hex characters
    const otpCode = parseInt(otp, 16).toString().padStart(6, '0').slice(0, 6)

    console.log('Generated OTP:', {
      email: email.toLowerCase(),
      otp: otpCode,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    })

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() })

    // Create OTP document
    const otpDoc = await OTP.create({
      email: email.toLowerCase(),
      otp: otpCode,
      expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      attempts: 0,
      lastAttempt: new Date(),
      userAgent,
      ipAddress,
    })

    console.log('Created OTP document:', {
      id: otpDoc._id,
      email: otpDoc.email,
      otp: otpDoc.otp,
      expires: otpDoc.expires,
    })

    // Send OTP via email
    await sendEmail({
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otpCode}. This code will expire in 10 minutes.`,
      html: `
        <h1>Your OTP Code</h1>
        <p>Your OTP code is: <strong>${otpCode}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `,
    })

    return NextResponse.json(
      { message: 'OTP sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Error sending OTP:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
