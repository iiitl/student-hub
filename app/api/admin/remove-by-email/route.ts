import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import { verifyAdminApi } from '@/lib/auth-utils'

const SUPER_ADMIN_EMAIL = 'technicalclub@iiitl.ac.in'

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

    if (normalizedEmail === SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { message: 'Cannot remove the super admin' },
        { status: 403 }
      )
    }

    await dbConnect()

    const caller = await User.findById(authData.userId)
    if (caller && caller.email === normalizedEmail) {
      return NextResponse.json(
        { message: 'You cannot remove yourself as admin' },
        { status: 403 }
      )
    }

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return NextResponse.json(
        { message: 'No user found with this email' },
        { status: 404 }
      )
    }

    if (!user.roles.includes('admin')) {
      return NextResponse.json(
        { message: 'This user is not an admin' },
        { status: 200 }
      )
    }

    // Remove admin role, keep user role
    user.roles = user.roles.filter((role: string) => role !== 'admin')
    if (!user.roles.includes('user')) {
      user.roles.push('user')
    }
    await user.save()

    console.log(
      `[AUDIT] Admin removed: ${user.email} demoted by ${authData.userId} at ${new Date().toISOString()}`
    )

    return NextResponse.json({
      message: `${user.name} (${user.email}) has been removed as admin`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    })
  } catch (error) {
    console.error('Error removing admin:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
