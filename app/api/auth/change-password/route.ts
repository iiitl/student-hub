import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '../[...nextauth]/options'
import { validatePassword } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email.toLowerCase()
    await dbConnect()

    let reqBody;
    try {
      reqBody = await request.json()
    } catch (jsonError) {
      return NextResponse.json(
        { message: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = reqBody

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Prevent password reuse
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { message: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email: userEmail }).select('+password')

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    if (!user.password) {
      return NextResponse.json(
        { message: 'No password set for this account' },
        { status: 400 }
      )
    }

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

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    user.passwordSet = true
    await user.save()

    return NextResponse.json(
      { message: 'Password updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Error changing password:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
