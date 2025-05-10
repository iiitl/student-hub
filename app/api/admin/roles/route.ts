import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import { verifyAdminApi } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  // Verify admin privileges
  const auth = await verifyAdminApi(request)
  const authData = await auth.json()

  if (!authData.success) {
    return NextResponse.json(
      { message: authData.message },
      { status: auth.status }
    )
  }

  try {
    await dbConnect()

    // Get pagination parameters from query
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Return a list of all users with their roles
    const users = await User.find({}, 'name email roles')
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 })

    // Get total count for pagination metadata
    const total = await User.countDocuments({})

    return NextResponse.json({
      users: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  // Verify admin privileges
  const auth = await verifyAdminApi(request)
  const authData = await auth.json()

  if (!authData.success) {
    return NextResponse.json(
      { message: authData.message },
      { status: auth.status }
    )
  }

  try {
    const body = await request.json()
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json(
        { message: 'userId and action are required' },
        { status: 400 }
      )
    }

    if (!['promote', 'demote'].includes(action)) {
      return NextResponse.json(
        { message: 'Action must be either "promote" or "demote"' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Prevent admins from demoting themselves
    if (userId === authData.userId && action === 'demote') {
      return NextResponse.json(
        { message: 'Admins cannot demote themselves' },
        { status: 403 }
      )
    }

    // Update roles
    if (action === 'promote' && !user.roles.includes('admin')) {
      // Ensure user role exists and add admin role
      if (!user.roles.includes('user')) {
        user.roles.push('user')
      }
      user.roles.push('admin')
    } else if (action === 'demote') {
      // Only remove admin role, preserve user role
      user.roles = user.roles.filter((role) => role !== 'admin')
      // Ensure user role exists
      if (!user.roles.includes('user')) {
        user.roles.push('user')
      }
    } else {
      return NextResponse.json(
        { message: 'No change needed - user already has the appropriate role' },
        { status: 200 }
      )
    }

    await user.save()

    return NextResponse.json({
      message: `User ${action === 'promote' ? 'promoted to admin' : 'demoted from admin'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    })
  } catch (error) {
    console.error(
      'Error updating user roles:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
