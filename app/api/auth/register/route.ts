import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import OTP from '@/model/OTP'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { name, email, password, otpCode } = body

    // Basic validation
    if (!name || !email || !password || !otpCode) {
      const missingFields = []
      if (!name) missingFields.push('name')
      if (!email) missingFields.push('email')
      if (!password) missingFields.push('password')
      if (!otpCode) missingFields.push('otpCode')

      return NextResponse.json(
        { message: `Required fields missing: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedName = name.trim()
    const sanitizedEmail = email.trim().toLowerCase()

    // Validate IIITL domain
    if (!sanitizedEmail.endsWith('@iiitl.ac.in')) {
      return NextResponse.json(
        { message: 'Only IIITL email addresses are allowed' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: sanitizedEmail })

    if (existingUser) {
      // If user exists and was created with Google, we should not allow them to register
      const responseData = {
        message: 'An account with this email already exists',
        type: existingUser.googleId ? 'GOOGLE_ACCOUNT' : 'EMAIL_ACCOUNT',
      }

      return NextResponse.json(responseData, { status: 409 })
    }

    // Verify OTP
    const otpDoc = await OTP.findOne({
      email: sanitizedEmail,
      otp: otpCode,
      expires: { $gt: new Date() }, // OTP must not be expired
      verified: false, // OTP must not have been verified before
    })

    if (!otpDoc) {
      return NextResponse.json(
        { message: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const newUser = await User.create({
      name: sanitizedName,
      email: sanitizedEmail,
      password: hashedPassword,
      passwordSet: true,
      emailVerified: true, // Email is verified since OTP is valid
      roles: ['user'], // Set default role
    })

    // Mark OTP as verified and delete it
    await Promise.all([
      OTP.updateOne({ _id: otpDoc._id }, { $set: { verified: true } }),
      OTP.deleteMany({
        email: sanitizedEmail,
        _id: { $ne: otpDoc._id },
        verified: false,
      }),
    ])

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          roles: newUser.roles,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      'Error registering user:',
      error instanceof Error ? error.message : 'Unknown error'
    )

    // Handle specific MongoDB errors
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: Object.values(error.errors).map((e) => e.message),
        },
        { status: 400 }
      )
    }

    // Check for duplicate key error (MongoDB error code 11000)
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
