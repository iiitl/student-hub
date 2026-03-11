import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import { verifyAdminApi } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminApi(request, true)
  const authData = await auth.json()

  if (!authData.success) {
    return NextResponse.json(
      { message: authData.message },
      { status: auth.status }
    )
  }

  try {
    await dbConnect()

    // Find all users who have the admin role
    const admins = await User.find({ roles: 'admin' }, 'name email roles').sort(
      { name: 1 }
    )

    return NextResponse.json({
      admins: admins.map((admin) => ({
        id: admin._id,
        name: admin.name,
        email: admin.email,
        roles: admin.roles,
      })),
    })
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
