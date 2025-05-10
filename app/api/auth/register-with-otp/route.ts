import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import OTP from '@/model/OTP'
import mongoose from 'mongoose'
import {
  validateEmail,
  validatePassword,
  validateName,
  validateOTP,
} from '@/lib/validation'

const MAX_RETRIES = 3

export async function POST(request: NextRequest) {
  let retries = 0
  let session: mongoose.ClientSession | null = null

  while (retries < MAX_RETRIES) {
    try {
      session = await mongoose.startSession()
      session.startTransaction()

      await dbConnect()

      const { name, email, password, otp } = await request.json()

      // Basic validation
      if (!name || !email || !password || !otp) {
        await session.abortTransaction()
        return NextResponse.json(
          { message: 'Name, email, password, and OTP are required' },
          { status: 400 }
        )
      }

      // Validate inputs
      const nameError = validateName(name)
      if (nameError) {
        await session.abortTransaction()
        return NextResponse.json({ message: nameError }, { status: 400 })
      }

      const emailError = validateEmail(email)
      if (emailError) {
        await session.abortTransaction()
        return NextResponse.json({ message: emailError }, { status: 400 })
      }

      const passwordError = validatePassword(password)
      if (passwordError) {
        await session.abortTransaction()
        return NextResponse.json({ message: passwordError }, { status: 400 })
      }

      const otpError = validateOTP(otp)
      if (otpError) {
        await session.abortTransaction()
        return NextResponse.json({ message: otpError }, { status: 400 })
      }

      // Sanitize email
      const sanitizedEmail = email.trim().toLowerCase()

      // Validate IIITL domain
      if (!sanitizedEmail.endsWith('@iiitl.ac.in')) {
        await session.abortTransaction()
        return NextResponse.json(
          { message: 'Only IIITL email addresses are allowed' },
          { status: 400 }
        )
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        email: sanitizedEmail,
      }).session(session)

      if (existingUser) {
        await session.abortTransaction()
        // If user exists and was created with Google, we should not allow them to register
        const responseData = {
          message: 'An account with this email already exists',
          type: existingUser.googleId ? 'GOOGLE_ACCOUNT' : 'EMAIL_ACCOUNT',
        }

        return NextResponse.json(responseData, { status: 409 })
      }

      // Find and verify OTP
      const otpDoc = await OTP.findOne({
        email: sanitizedEmail,
        otp,
        expires: { $gt: new Date() },
        verified: true, // OTP must be verified
      }).session(session)

      if (!otpDoc) {
        await session.abortTransaction()
        return NextResponse.json(
          { message: 'Invalid or expired OTP. Please verify your OTP first.' },
          { status: 400 }
        )
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create new user
      const newUser = await User.create(
        [
          {
            name,
            email: sanitizedEmail,
            password: hashedPassword,
            passwordSet: true,
            emailVerified: true,
            roles: ['user'],
          },
        ],
        { session }
      )

      // Delete the used OTP
      await OTP.deleteOne({ _id: otpDoc._id }).session(session)

      // Commit the transaction
      await session.commitTransaction()

      return NextResponse.json(
        {
          message: 'User registered successfully',
          user: {
            id: newUser[0]._id,
            name: newUser[0].name,
            email: newUser[0].email,
            roles: newUser[0].roles,
          },
        },
        { status: 201 }
      )
    } catch (error) {
      if (session) {
        await session.abortTransaction()
      }

      // Check if it's a write conflict error
      if (
        error instanceof Error &&
        error.message.includes('Write conflict') &&
        retries < MAX_RETRIES - 1
      ) {
        retries++
        // Wait for a short time before retrying
        await new Promise((resolve) => setTimeout(resolve, 100 * retries))
        continue
      }

      console.error(
        'Error registering user:',
        error instanceof Error ? error.message : 'Unknown error'
      )
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      if (session) {
        await session.endSession()
      }
    }
  }

  return NextResponse.json(
    { message: 'Failed to register after multiple attempts' },
    { status: 500 }
  )
}
