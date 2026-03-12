import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import QuickRead from '@/model/QuickRead'
import { verifyJwt } from '@/lib/auth-utils'
import User from '@/model/User'

export const dynamic = 'force-dynamic'

// Allow anyone to fetch quick reads (publicly visible)
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const categoryQuery = searchParams.get('category')

    const filter: Record<string, string> = {}
    if (categoryQuery) {
      filter.category = categoryQuery
    }

    const quickReads = await QuickRead.find(filter)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email')
      .lean()

    return NextResponse.json({ success: true, quickReads }, { status: 200 })
  } catch (error) {
    console.error('Error fetching quick reads:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch quick reads' },
      { status: 500 }
    )
  }
}

// Admins only: Create new quick read
export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const authResponse = await verifyJwt(request)
    if (authResponse.status !== 200) {
      return authResponse
    }
    const authData = await authResponse.json()
    const userId = authData.userId as string

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const isSuperAdmin = user.email === 'technicalclub@iiitl.ac.in'
    const hasAdminRole = Array.isArray(user.roles) && user.roles.includes('admin')
    
    if (!isSuperAdmin && !hasAdminRole) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admins only.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, url, category, source } = body

    if (!title || !url || !category) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields (title, url, category)' },
        { status: 400 }
      )
    }

    const newQuickRead = await QuickRead.create({
      title,
      description,
      url,
      category,
      source: source || 'StudentHub',
      uploadedBy: userId,
    })

    return NextResponse.json(
      { success: true, message: 'Quick Read created successfully', quickRead: newQuickRead },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating quick read:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create quick read' },
      { status: 500 }
    )
  }
}

// Admins only: Delete a quick read
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect()

    const authResponse = await verifyJwt(request)
    if (authResponse.status !== 200) {
      return authResponse
    }
    const authData = await authResponse.json()
    const userId = authData.userId as string

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Quick Read ID is required' },
        { status: 400 }
      )
    }

    // Verify Admin role
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const isSuperAdmin = user.email === 'technicalclub@iiitl.ac.in'
    const hasAdminRole = Array.isArray(user.roles) && user.roles.includes('admin')
    
    // Quick read uploader can also delete their own content
    const quickRead = await QuickRead.findById(id)
    if (!quickRead) {
      return NextResponse.json(
        { success: false, message: 'Quick read not found' },
        { status: 404 }
      )
    }

    const isOwner = quickRead.uploadedBy?.toString() === userId

    if (!isSuperAdmin && !hasAdminRole && !isOwner) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to delete this item' },
        { status: 403 }
      )
    }

    await QuickRead.findByIdAndDelete(id)

    return NextResponse.json(
      { success: true, message: 'Quick read deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting quick read:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete quick read' },
      { status: 500 }
    )
  }
}

// Admins only: Update a quick read
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect()

    const authResponse = await verifyJwt(request)
    if (authResponse.status !== 200) {
      return authResponse
    }
    const authData = await authResponse.json()
    const userId = authData.userId as string

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const isSuperAdmin = user.email === 'technicalclub@iiitl.ac.in'
    const hasAdminRole = Array.isArray(user.roles) && user.roles.includes('admin')

    const body = await request.json()
    const { id, title, description, url, category, source } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Quick Read ID is required' },
        { status: 400 }
      )
    }
    
    // Quick read uploader can also edit their own content
    const quickRead = await QuickRead.findById(id)
    if (!quickRead) {
      return NextResponse.json(
        { success: false, message: 'Quick read not found' },
        { status: 404 }
      )
    }

    const isOwner = quickRead.uploadedBy?.toString() === userId

    if (!isSuperAdmin && !hasAdminRole && !isOwner) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to edit this item' },
        { status: 403 }
      )
    }

    if (title) quickRead.title = title
    if (description !== undefined) quickRead.description = description
    if (url) quickRead.url = url
    if (category) quickRead.category = category
    if (source !== undefined) quickRead.source = source

    await quickRead.save()

    return NextResponse.json(
      { success: true, message: 'Quick read updated successfully', quickRead },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating quick read:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update quick read' },
      { status: 500 }
    )
  }
}
