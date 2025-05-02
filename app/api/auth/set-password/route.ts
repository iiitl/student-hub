import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { email, password } = await request.json()

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // We should allow setting password for any user that hasn't set one yet,
    // regardless of how they authenticated (Google or direct registration)
    if (user.passwordSet) {
      return NextResponse.json(
        {
          message:
            'Password is already set. Please use the change password option instead.',
        },
        { status: 403 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user with new password
    user.password = hashedPassword
    user.passwordSet = true
    await user.save()

    return NextResponse.json(
      { message: 'Password set successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error setting password:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
