import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Category from '@/model/quick_read_category'
import User from '@/model/User'
import { verifyJwt } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

// Public: Get all categories (with content)
export async function GET() {
  try {
    await dbConnect()

    const categories = await Category.find()
      .sort({ order: 1, createdAt: 1 })
      .lean()

    return NextResponse.json({ success: true, categories }, { status: 200 })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// Admins only: Create new category
export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const authResponse = await verifyJwt(request)
    if (authResponse.status !== 200) return authResponse

    const authData = await authResponse.json()
    const userId = authData.userId as string

    const user = await User.findById(userId)
    if (!user)
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )

    const isSuperAdmin = user.email === 'technicalclub@iiitl.ac.in'
    const hasAdminRole =
      Array.isArray(user.roles) && user.roles.includes('admin')

    if (!isSuperAdmin && !hasAdminRole) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admins only.' },
        { status: 403 }
      )
    }

    const { name, content } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      )
    }

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Category already exists' },
        { status: 400 }
      )
    }

    const category = await Category.create({
      name: name.trim(),
      content: content || '',
      createdBy: userId,
    })

    return NextResponse.json(
      { success: true, message: 'Category created', category },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create category' },
      { status: 500 }
    )
  }
}

// Admins only: Delete category
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect()

    const authResponse = await verifyJwt(request)
    if (authResponse.status !== 200) return authResponse

    const authData = await authResponse.json()
    const userId = authData.userId as string

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id)
      return NextResponse.json(
        { success: false, message: 'Category ID required' },
        { status: 400 }
      )

    const user = await User.findById(userId)
    if (!user)
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )

    const isSuperAdmin = user.email === 'technicalclub@iiitl.ac.in'
    const hasAdminRole =
      Array.isArray(user.roles) && user.roles.includes('admin')

    if (!isSuperAdmin && !hasAdminRole) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admins only.' },
        { status: 403 }
      )
    }

    const category = await Category.findById(id)
    if (!category)
      return NextResponse.json(
        { success: false, message: 'Not found' },
        { status: 404 }
      )

    await Category.findByIdAndDelete(id)

    return NextResponse.json(
      { success: true, message: 'Category deleted' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete category' },
      { status: 500 }
    )
  }
}

// Admins only: Update category name and/or content
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect()

    const authResponse = await verifyJwt(request)
    if (authResponse.status !== 200) return authResponse

    const authData = await authResponse.json()
    const userId = authData.userId as string

    const user = await User.findById(userId)
    if (!user)
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )

    const isSuperAdmin = user.email === 'technicalclub@iiitl.ac.in'
    const hasAdminRole =
      Array.isArray(user.roles) && user.roles.includes('admin')

    if (!isSuperAdmin && !hasAdminRole) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admins only.' },
        { status: 403 }
      )
    }

    const { id, newName, content } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Category ID is required' },
        { status: 400 }
      )
    }

    const category = await Category.findById(id)
    if (!category)
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )

    if (newName) {
      const existing = await Category.findOne({
        name: { $regex: new RegExp(`^${newName}$`, 'i') },
      })
      if (existing && String(existing._id) !== id) {
        return NextResponse.json(
          { success: false, message: 'Category name already exists' },
          { status: 400 }
        )
      }
      category.name = newName.trim()
    }

    if (content !== undefined) {
      category.content = content
    }

    await category.save()

    return NextResponse.json(
      { success: true, message: 'Category updated', category },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update category' },
      { status: 500 }
    )
  }
}
