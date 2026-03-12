import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import { verifyAdminApi } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  const auth = await verifyAdminApi(request, true)
  const authData = await auth.json()

  if (!authData.success) {
    return NextResponse.json(
      { message: authData.message },
      { status: auth.status }
    )
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    await dbConnect()

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return NextResponse.json(
        { message: 'No user found with this email. They must sign up first.' },
        { status: 404 }
      )
    }

    if (user.roles.includes('admin')) {
      return NextResponse.json(
        { message: 'This user is already an admin' },
        { status: 200 }
      )
    }

    // Add admin role
    user.roles = [...new Set([...user.roles, 'admin'])]
    await user.save()

    console.log(
      `[AUDIT] Admin added: ${user.email} promoted by ${authData.userId} at ${new Date().toISOString()}`
    )

    return NextResponse.json({
      message: `${user.name} (${user.email}) has been promoted to admin`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    })
  } catch (error) {
    console.error('Error adding admin:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
