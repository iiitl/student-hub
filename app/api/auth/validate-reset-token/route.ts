import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import PasswordReset from '@/model/PasswordReset'
import { hashSensitiveData } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      )
    }

    await dbConnect()

    const hashedToken = await hashSensitiveData(token)

    const resetRequest = await PasswordReset.findOne({
      token: hashedToken,
      expires: { $gt: new Date() },
      used: false,
    })

    if (!resetRequest) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Token is valid' }, { status: 200 })
  } catch {
    return NextResponse.json(
      { message: 'Error validating token' },
      { status: 500 }
    )
  }
}
