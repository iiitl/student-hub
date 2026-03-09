import dbConnect from '@/lib/dbConnect'
import { NextRequest, NextResponse } from 'next/server'
import Location from '@/model/location'
import { verifyJwt } from '@/lib/auth-utils'
import User from '@/model/User'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    const { id } = await context.params

    // Verify JWT
    const authResponse = await verifyJwt(request)
    if (authResponse.status !== 200) {
      return authResponse
    }

    const authData = await authResponse.json()
    const userId = authData.userId as string

    // Fetch user
    const user = await User.findById(userId)

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Check admin
    if (user.email !== "technicalclub@iiitl.ac.in") {
  return NextResponse.json(
    { message: "Admin access is needed" },
    { status: 403 }
  )
}

    // Read request body
    const body = await request.json()

    const { name, category, address, location, contact, website } = body

    // Update location
    const updatedLocation = await Location.findByIdAndUpdate(
      id,
      { name, category, address, location, contact, website },
      { new: true, runValidators: true }
    )

    if (!updatedLocation) {
      return NextResponse.json(
        { message: 'Location not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        message: 'Details updated successfully',
        data: updatedLocation
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Update error:', error)

    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    const { id } = await context.params

    // Verify JWT
    const authResponse = await verifyJwt(request)
    if (authResponse.status !== 200) {
      return authResponse
    }

    const authData = await authResponse.json()
    const userId = authData.userId as string

    // Fetch user
    const user = await User.findById(userId)

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Check admin
if (user.email !== "technicalclub@iiitl.ac.in") {
  return NextResponse.json(
    { message: "Admin access is needed" },
    { status: 403 }
  )
}

    // Delete location
    const deletedLocation = await Location.findByIdAndDelete(id)

    if (!deletedLocation) {
      return NextResponse.json(
        { message: 'Location not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        message: 'Location deleted successfully',
        data: deletedLocation
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete error:', error)

    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}