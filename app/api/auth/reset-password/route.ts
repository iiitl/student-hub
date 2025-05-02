import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'
import PasswordReset from '@/model/PasswordReset'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { token, password } = await request.json()
    
    // Validate inputs
    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and password are required' },
        { status: 400 }
      )
    }
    
    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }
    
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
    
    // Find the user by email
    const user = await User.findOne({ email: resetRequest.email })
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Update user with new password
    user.password = hashedPassword
    user.passwordSet = true
    await user.save()
    
    // Delete all password reset tokens for this user
    await PasswordReset.deleteMany({ email: resetRequest.email })
    
    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 