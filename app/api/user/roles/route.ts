import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import { verifyJwt } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const authResponse = await verifyJwt(request)
    if (authResponse.status !== 200) {
      return authResponse
    }

    const authData = await authResponse.json()
    const userId = authData.userId as string

    await dbConnect()

    const user = await User.findById(userId).select('roles email')
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(
      { roles: user.roles, email: user.email },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching user roles:', error)
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
