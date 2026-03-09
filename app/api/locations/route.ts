import Location from '@/model/location'
import dbConnect from '@/lib/dbConnect'
import { NextRequest, NextResponse } from 'next/server'
import User from '@/model/User'
import { verifyJwt } from '@/lib/auth-utils'
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let locations
    if (category) {
      locations = await Location.find({ category })
    } else {
      locations = await Location.find()
    }
    return NextResponse.json({
      data: locations,
    })
  } catch (error) {
    console.log((error as Error).message)

    return NextResponse.json(
      {
        message: `Failed to fetch locations: ${(error as Error).message}`,
      },
      { status: 500 }
    )
  }
}
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    let userId: string | null = null
    const authResponse = await verifyJwt(request)
    if (authResponse.status !== 200) {
      return authResponse
    }

    const authData = await authResponse.json()
    userId = authData.userId as string
    const user = await User.findById(userId) // we found full user from user id
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    if (user.email !== 'technicalclub@iiitl.ac.in') {
      return NextResponse.json(
        { message: 'Admin access is needed' },
        { status: 403 }
      )
    }
    const { name, category, address, location, contact, website } =
      await request.json()
    // validating mandatory fields
    if (!name || !category || !address || !location) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }
    const newLocation = await Location.create({
      name,
      category,
      address,
      location,
      contact,
      website,
    })

    return NextResponse.json(
      {
        message: 'Location added successfully',
        data: newLocation,
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message },
      { status: 500 }
    )
  }

  // check if user is an admin
}
