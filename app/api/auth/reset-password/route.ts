import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import PasswordReset from '@/model/PasswordReset'
import { validatePassword } from '@/lib/validation'
import { hashSensitiveData } from '@/lib/security'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  await dbConnect()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = mongoose.connection.client as any
  const isStandalone = client?.topology?.description?.type === 'Single'
  const session = isStandalone ? null : await mongoose.startSession()
  if (session) {
    session.startTransaction()
  }

  try {
    // Sanitize inputs
    let { token, password } = await request.json()
    token = typeof token === 'string' ? token.trim() : null
    password = typeof password === 'string' ? password : null

    if (!token || !password) {
      if (session) await session.abortTransaction()
      return NextResponse.json(
        { message: 'Token and password are required' },
        { status: 400 }
      )
    }

    const validationError = validatePassword(password)
    if (validationError) {
      if (session) await session.abortTransaction()
      return NextResponse.json({ message: validationError }, { status: 400 })
    }

    const hashedToken = await hashSensitiveData(token)

    const resetRequest = await PasswordReset.findOne({
      token: hashedToken,
      expires: { $gt: new Date() },
      used: false,
    }).session(session)

    if (!resetRequest) {
      if (session) await session.abortTransaction()
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
      if (session) await session.abortTransaction()
      return NextResponse.json(
        { message: 'Too many attempts. Please request a new reset link.' },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email: resetRequest.email }).session(
      session
    )
    if (!user) {
      if (session) await session.abortTransaction()
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    user.password = hashedPassword
    await user.save({ session })

    resetRequest.used = true
    await resetRequest.save({ session })

    if (session) {
      await session.commitTransaction()
    }

    return NextResponse.json(
      { message: 'Password reset successful' },
      { status: 200 }
    )
  } catch (error) {
    if (session) {
      await session.abortTransaction()
    }

    // Log error details
    console.error(
      'Error in reset-password route:',
      error instanceof Error ? error.message : 'Unknown error'
    )

    return NextResponse.json(
      { message: 'Error resetting password' },
      { status: 500 }
    )
  } finally {
    if (session) {
      session.endSession()
    }
  }
}
