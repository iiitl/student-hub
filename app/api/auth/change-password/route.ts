import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '../[...nextauth]/route'

export async function POST(request: NextRequest) {
  try {
    // Get the current authenticated user from session
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { currentPassword, newPassword } = await request.json()

    // Basic validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Find user by email from session
    const user = await User.findOne({ email: session.user.email.toLowerCase() })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Handle users who signed up with Google but haven't set a password yet
    if (!user.passwordSet || !user.password) {
      // For Google-only users, just set the new password without checking the current one
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      user.password = hashedPassword
      user.passwordSet = true
      await user.save()

      return NextResponse.json(
        { message: 'Password set successfully' },
        { status: 200 }
      )
    }

    // Verify current password
    const isCorrectPassword = await bcrypt.compare(
      currentPassword,
      user.password
    )

    if (!isCorrectPassword) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    user.passwordSet = true
    await user.save()

    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
