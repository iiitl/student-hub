import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  /**
   * Extends the built-in session types
   */
  interface Session {
    user?: {
      id?: string
    } & DefaultSession['user']
  }

  /**
   * Extends the built-in user types
   */
  interface User {
    id?: string
  }
}
