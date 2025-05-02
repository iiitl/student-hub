import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import dbConnect from '@/lib/dbConnect'
import User from '@/model/User'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { name, email, password } = await request.json()
    
    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      )
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    
    if (existingUser) {
      // If user exists and was created with Google, we should not allow them to register
      // They should set a password instead
      if (existingUser.googleId) {
        return NextResponse.json(
          { 
            message: 'An account with this email already exists. It was created with Google. Please sign in with Google or use the forgot password option.',
            type: 'GOOGLE_ACCOUNT'
          },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 409 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create new user
    await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      passwordSet: true,
    })
    
    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error registering user:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 