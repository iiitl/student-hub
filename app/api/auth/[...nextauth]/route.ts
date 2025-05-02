import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import dbConnect from '@/lib/dbConnect'
import User, { IUser } from '@/model/User'
import { Types } from 'mongoose'

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
        const user = await User.findOne({ email: credentials.email.toLowerCase() }) as IUser | null

        if (!user) {
          throw new Error('User not found')
        }

        // For users who registered with Google but haven't set a password
        if (!user.passwordSet || !user.password) {
          throw new Error('PASSWORD_NOT_SET')
        }

        // Compare password
        const isCorrectPassword = await bcrypt.compare(credentials.password, user.password)

        if (!isCorrectPassword) {
          throw new Error('Invalid password')
        }

        return {
          id: user._id.toString(),
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
      if (account?.provider === 'google' && user.email) {
        await dbConnect()
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: user.email as string }) as IUser | null
        let isNewUser = false;
        
        if (existingUser) {
          // Update Google ID if needed
          if (!existingUser.googleId && user.id) {
            existingUser.googleId = user.id as string
            existingUser.image = user.image
            await existingUser.save()
          }
        } else {
          // Create new user from Google auth
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            googleId: user.id,
            passwordSet: false,
          })
          isNewUser = true;
        }
        
        // For new Google users or existing Google users without a password set,
        // we'll redirect them to the set-password page after successful login
        if (isNewUser || (existingUser && !existingUser.passwordSet)) {
          return `/auth/set-password?email=${encodeURIComponent(user.email as string)}${isNewUser ? '&new=true' : ''}`
        }
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
      if (user && 'id' in user) {
        token.id = user.id as string
      }
      return token
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 