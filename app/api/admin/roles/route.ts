import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import { verifyAdminApi } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  // Verify admin privileges
  const auth = await verifyAdminApi(request)
  if (!auth.success) {
    return NextResponse.json(
      { message: auth.message },
      { status: auth.status }
    )
  }

  try {
    await dbConnect()
    
    // Return a list of all users with their roles
    const users = await User.find({}, 'name email roles')
    
    return NextResponse.json({
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles
      }))
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
  if (!auth.success) {
    return NextResponse.json(
      { message: auth.message },
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
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }
    
    // Prevent admins from demoting themselves
    if (userId === auth.userId && action === 'demote') {
      return NextResponse.json(
        { message: 'Admins cannot demote themselves' },
        { status: 403 }
      )
    }
    
    // Update roles
    if (action === 'promote' && !user.roles.includes('admin')) {
      user.roles.push('admin')
    } else if (action === 'demote') {
      user.roles = user.roles.filter(role => role !== 'admin')
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
        roles: user.roles
      }
    })
  } catch (error) {
    console.error('Error updating user roles:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 