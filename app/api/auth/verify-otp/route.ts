import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import OTP from '@/model/OTP'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp } = body

    // Basic validation
    if (!email || !otp) {
      return NextResponse.json(
        { message: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase()

    await dbConnect()

    // Perform the verification with all conditions
    const otpDoc = await OTP.findOne({
      email: sanitizedEmail,
      otp,
      expires: { $gt: new Date() }, // OTP must not be expired
    })

    if (!otpDoc) {
      return NextResponse.json(
        { message: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // OTP is valid, but don't delete it - it will be used again during registration
    return NextResponse.json(
      { 
        message: 'Email verified successfully',
        verified: true 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 