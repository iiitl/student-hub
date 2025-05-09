import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import PasswordReset from '@/model/PasswordReset'
import { validatePassword } from '@/lib/validation'
import { hashSensitiveData } from '@/lib/security'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    await dbConnect()

    // Sanitize inputs
    let { token, password } = await request.json()
    token = typeof token === 'string' ? token.trim() : null
    password = typeof password === 'string' ? password : null

    if (!token || !password) {
      await session.abortTransaction()
      return NextResponse.json(
        { message: 'Token and password are required' },
        { status: 400 }
      )
    }

    const validationError = validatePassword(password)
    if (validationError) {
      await session.abortTransaction()
      return NextResponse.json({ message: validationError }, { status: 400 })
    }

    const hashedToken = await hashSensitiveData(token)

    const resetRequest = await PasswordReset.findOne({
      token: hashedToken,
      expires: { $gt: new Date() },
      used: false,
    }).session(session)

    if (!resetRequest) {
      await session.abortTransaction()
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    // Increment attempts counter
    resetRequest.attempts = (resetRequest.attempts || 0) + 1

    // If too many attempts, invalidate the token
    const MAX_ATTEMPTS = 5
    if (resetRequest.attempts > MAX_ATTEMPTS) {
      resetRequest.used = true
      await resetRequest.save({ session })
      await session.abortTransaction()
      return NextResponse.json(
        { message: 'Too many attempts. Please request a new reset link.' },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email: resetRequest.email }).session(
      session
    )
    if (!user) {
      await session.abortTransaction()
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    user.password = hashedPassword
    await user.save({ session })

    resetRequest.used = true
    await resetRequest.save({ session })

    await session.commitTransaction()

    return NextResponse.json(
      { message: 'Password reset successful' },
      { status: 200 }
    )
  } catch (error) {
    await session.abortTransaction()

    // Log error details
    console.error(
      'Error in reset-password route:',
      error instanceof Error ? error.message : 'Unknown error'
    )

    await session.abortTransaction()
    return NextResponse.json(
      { message: 'Error resetting password' },
      { status: 500 }
    )
  } finally {
    session.endSession()
  }
}
