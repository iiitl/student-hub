import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import dbConnect from '@/lib/dbConnect'
import PasswordReset from '@/model/PasswordReset'

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
    
    // Hash the token to compare with stored value
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')
    
    // Find token document and check expiry
    const resetRequest = await PasswordReset.findOne({
      token: hashedToken,
      expires: { $gt: new Date() }, // Token must not be expired
    })
    
    if (!resetRequest) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { valid: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error validating token:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 