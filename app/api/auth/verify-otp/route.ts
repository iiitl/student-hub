import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import OTP from '@/model/OTP'
import { validateEmail } from '@/lib/validation'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const body = await request.json()
    const { email, otp } = body

    // Validate email
    const emailError = validateEmail(email)
    if (emailError) {
      await session.abortTransaction()
      return NextResponse.json({ message: emailError }, { status: 400 })
    }

    // Basic validation
    if (!otp) {
      await session.abortTransaction()
      return NextResponse.json({ message: 'OTP is required' }, { status: 400 })
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase()

    await dbConnect()

    // Find the OTP document
    const otpDoc = await OTP.findOne({
      email: sanitizedEmail,
      otp,
      expires: { $gt: new Date() }, // OTP must not be expired
      verified: false, // OTP must not have been verified before
    }).session(session)

    if (!otpDoc) {
      // If OTP not found, check if it's expired or already verified
      const expiredOtp = await OTP.findOne({
        email: sanitizedEmail,
        otp,
        expires: { $lte: new Date() },
      }).session(session)

      if (expiredOtp) {
        await session.abortTransaction()
        return NextResponse.json(
          { message: 'OTP has expired. Please request a new one.' },
          { status: 400 }
        )
      }

      const verifiedOtp = await OTP.findOne({
        email: sanitizedEmail,
        otp,
        verified: true,
      }).session(session)

      if (verifiedOtp) {
        await session.abortTransaction()
        return NextResponse.json(
          { message: 'OTP has already been used. Please request a new one.' },
          { status: 400 }
        )
      }

      await session.abortTransaction()
      return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 })
    }

    // Update attempts count and mark as verified
    await OTP.updateOne(
      { _id: otpDoc._id },
      {
        $inc: { attempts: 1 },
        $set: {
          lastAttempt: new Date(),
          verified: true,
        },
      }
    ).session(session)

    await session.commitTransaction()

    return NextResponse.json(
      {
        message: 'Email verified successfully',
        verified: true,
      },
      { status: 200 }
    )
  } catch (error) {
    await session.abortTransaction()
    console.error(
      'Error verifying OTP:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await session.endSession()
  }
}
