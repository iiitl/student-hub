import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import OTP from '@/model/OTP'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { name, email, password, otpCode } = body

    // Basic validation
    if (!name || !email || !password || !otpCode) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');
      if (!otpCode) missingFields.push('otpCode');
      
      return NextResponse.json(
        { message: `Required fields missing: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate IIITL domain
    if (!email.toLowerCase().endsWith('@iiitl.ac.in')) {
      return NextResponse.json(
        { message: 'Only IIITL email addresses are allowed' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })

    if (existingUser) {
      // If user exists and was created with Google, we should not allow them to register, They should set a password instead
      const responseData = {
        message: 'An account with this email already exists',
        type: existingUser.googleId ? 'GOOGLE_ACCOUNT' : 'EMAIL_ACCOUNT',
      }

      return NextResponse.json(responseData, { status: 409 })
    }

    // Verify OTP
    const otpDoc = await OTP.findOne({
      email: email.toLowerCase(),
      otp: otpCode,
      expires: { $gt: new Date() }, // OTP must not be expired
    })

    if (!otpDoc) {
      return NextResponse.json(
        { message: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Delete the OTP document to prevent reuse
    await OTP.deleteOne({ _id: otpDoc._id })

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      passwordSet: true,
      emailVerified: true, // Email is verified since OTP is valid
      roles: ['user'], // Set default role
    })

    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error registering user:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
