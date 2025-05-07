import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import OTP from '@/model/OTP'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect()

    const { name, email, password, otp } = await request.json()

    // Basic validation
    if (!name || !email || !password || !otp) {
      await session.abortTransaction();
      await session.endSession();
      return NextResponse.json(
        { message: 'Name, email, password, and OTP are required' },
        { status: 400 }
      )
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase()

    // Validate IIITL domain
    if (!sanitizedEmail.endsWith('@iiitl.ac.in')) {
      await session.abortTransaction();
      await session.endSession();
      return NextResponse.json(
        { message: 'Only IIITL email addresses are allowed' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: sanitizedEmail }).session(session)

    if (existingUser) {
      await session.abortTransaction();
      await session.endSession();
      
      // If user exists and was created with Google, we should not allow them to register
      const responseData = {
        message: 'An account with this email already exists',
        type: existingUser.googleId ? 'GOOGLE_ACCOUNT' : 'EMAIL_ACCOUNT',
      }

      return NextResponse.json(responseData, { status: 409 })
    }

    // Find and verify OTP without deleting it yet
    const otpDoc = await OTP.findOne({
      email: sanitizedEmail,
      otp,
      expires: { $gt: new Date() }, // OTP must not be expired
    }).session(session)

    if (!otpDoc) {
      await session.abortTransaction();
      await session.endSession();
      
      return NextResponse.json(
        { message: 'Invalid or expired OTP. Please request a new one.' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
      // Create new user
      await User.create([{
        name,
        email: sanitizedEmail,
        password: hashedPassword,
        passwordSet: true,
        emailVerified: true, // Email is verified since OTP is valid
        roles: ['user'], // Set default role
      }], { session });
      
      // Now delete the OTP since user creation was successful
      await OTP.deleteOne({ _id: otpDoc._id }).session(session);

      // Commit the transaction
      await session.commitTransaction();
      await session.endSession();

      return NextResponse.json(
        { message: 'User registered successfully' },
        { status: 201 }
      )
    } catch (createError) {
      await session.abortTransaction();
      await session.endSession();
      return NextResponse.json(
        { message: 'Failed to create user account' },
        { status: 500 }
      )
    }
  } catch (error) {
    // Abort transaction on error
    try {
      await session.abortTransaction();
      await session.endSession();
    } catch (sessionError) {
      console.error('Error aborting transaction:', sessionError);
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 