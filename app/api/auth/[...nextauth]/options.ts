import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import dbConnect from '@/lib/dbConnect'
import User, { IUser } from '@/model/User'
import mongoose from 'mongoose'

// Define a type for objects that might be Mongoose documents
type PossibleMongooseDocument = unknown

// Type guard to check if an object is a Mongoose document
const isMongooseDocument = (obj: PossibleMongooseDocument): boolean => {
  if (!obj) return false

  // Type assertion to check for _id property
  const docCandidate = obj as { _id?: mongoose.Types.ObjectId }
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '_id' in obj &&
    docCandidate._id instanceof mongoose.Types.ObjectId
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

        // Find user by email and explicitly select password and passwordSet
        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
        }).select('+password +passwordSet')

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
          // Type assertion since we've verified it has _id
          const userWithId = user as { _id: mongoose.Types.ObjectId }
          userId = userWithId._id.toString()
        } else {
          // Fallback for TypeScript
          userId = String((user as IUser)._id)
        }

        return {
          id: userId,
          name: user.name,
          email: user.email,
          image: user.image,
          roles: user.roles,
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

      // Validate IIITL domain for Google sign-in
      if (!user.email.toLowerCase().endsWith('@iiitl.ac.in')) {
        return '/auth/error?error=OnlyIIITLEmailsAllowed'
      }

      await dbConnect()

      // Check if user already exists
      const existingUser = (await User.findOne({
        email: user.email.toLowerCase(),
      }).select('+passwordSet +roles')) as IUser | null

      let dbUser: IUser | null = null
      let isNewUser = false

      if (existingUser) {
        dbUser = existingUser

        if (!existingUser.googleId && user.id) {
          dbUser = await User.findOneAndUpdate(
            { email: existingUser.email },
            {
              $set: {
                googleId: user.id,
                image: user.image || undefined,
                emailVerified: true,
              },
            },
            { new: true, runValidators: true }
          )
        }
      } else {
        dbUser = await User.create({
          name: user.name,
          email: user.email,
          image: user.image || undefined,
          googleId: user.id,
          passwordSet: false,
          emailVerified: true,
          roles: ['user'],
        })
        isNewUser = true
      }

      if (dbUser && dbUser._id) {
        const mutableUser = user as {
          id?: string
          roles?: string[]
        }

        mutableUser.id = dbUser._id.toString()
        mutableUser.roles = dbUser.roles
      }

      if (isNewUser || (dbUser && !dbUser.passwordSet)) {
        return `/auth/set-password?email=${encodeURIComponent(user.email)}${
          isNewUser ? '&new=true' : ''
        }`
      }

      return true
    },

    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      // Add roles to session
      if (token.roles && session.user) {
        session.user.roles = token.roles as string[]
      }
      return session
    },

    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        // Add roles to token
        token.roles = user.roles
      }
      return token
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
    updateAge: 60 * 60,
  },

  jwt: {
    maxAge: 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
}
