import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'

// Allowed landing page paths
const ALLOWED_PATHS = [
  '/',
  '/mess-menu',
  '/quick-reads',
  '/notes',
  '/papers',
  '/marketplace',
  '/chat',
  '/newcomers',
  '/contributors',
  '/profile',
]

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const user = await User.findOne({ email: token.email })
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(
      { landingPage: user.landingPage || '/' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching landing page preference:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { landingPage } = body

    if (!landingPage || typeof landingPage !== 'string') {
      return NextResponse.json(
        { message: 'landingPage is required' },
        { status: 400 }
      )
    }

    // Validate against allowed paths to prevent open redirect
    if (!ALLOWED_PATHS.includes(landingPage)) {
      return NextResponse.json(
        { message: 'Invalid landing page path' },
        { status: 400 }
      )
    }

    await dbConnect()

    const user = await User.findOneAndUpdate(
      { email: token.email },
      { landingPage },
      { new: true }
    )

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(
      { landingPage: user.landingPage, message: 'Landing page updated' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating landing page preference:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
