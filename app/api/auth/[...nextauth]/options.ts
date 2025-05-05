import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import dbConnect from '@/lib/dbConnect'
import User, { IUser } from '@/model/User'
import mongoose from 'mongoose'

// Define a type for objects that might be Mongoose documents
type PossibleMongooseDocument = unknown

// Type guard to check if a value is a Mongoose document with _id
function isMongooseDocument(
  obj: PossibleMongooseDocument
): obj is { _id: mongoose.Types.ObjectId } {
  if (!obj || typeof obj !== 'object') return false

  // Use type predicates to narrow down the type
  const maybeDoc = obj as Record<string, unknown>

  return (
    '_id' in maybeDoc &&
    maybeDoc._id !== null &&
    maybeDoc._id !== undefined &&
    typeof maybeDoc._id === 'object' &&
    // Check for toString method on _id
    'toString' in maybeDoc._id &&
    typeof maybeDoc._id.toString === 'function'
  )
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        await dbConnect()

        // Find user by email
        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
        })

        if (!user) {
          throw new Error('Invalid Credentials')
        }

        // For users who registered with Google but haven't set a password
        if (!user.passwordSet || !user.password) {
          throw new Error('PASSWORD_NOT_SET')
        }

        // Compare password
        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isCorrectPassword) {
          throw new Error('Invalid Credentials')
        }

        // Safe way to handle Mongoose _id
        let userId = ''
        if (isMongooseDocument(user)) {
          userId = user._id.toString()
        } else {
          // Fallback for TypeScript
          userId = String(user._id)
        }

        return {
          id: userId,
          name: user.name,
          email: user.email,
          image: user.image,
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account }) {
      // Skip if not Google sign in or if email is missing
      if (account?.provider !== 'google' || !user.email) {
        return true
      }

      await dbConnect()

      // Check if user already exists
      const existingUser = (await User.findOne({
        email:
          typeof user.email === 'string' ? user.email.toLowerCase() : undefined,
      })) as IUser | null

      let isNewUser = false

      if (existingUser) {
        // Update Google ID if needed
        if (!existingUser.googleId && user.id) {
          existingUser.googleId = user.id
          existingUser.image = user.image || undefined // Convert null to undefined
          await existingUser.save()
        }
      } else if (user.email) {
        // Create new user from Google auth
        await User.create({
          name: user.name,
          email: user.email,
          image: user.image || undefined, // Convert null to undefined
          googleId: user.id,
          passwordSet: false,
        })
        isNewUser = true
      }

      // For new Google users or existing Google users without a password set
      if (isNewUser || (existingUser && !existingUser.passwordSet)) {
        const email = user.email || ''
        return `/auth/set-password?email=${encodeURIComponent(email)}${isNewUser ? '&new=true' : ''}`
      }

      return true
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
