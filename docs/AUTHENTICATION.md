# Student Hub Authentication System

The Student Hub application uses a flexible authentication system that supports both Google OAuth and traditional email/password authentication. The system is designed to allow users who sign up with Google to also set a password for email-based login.

## Features

- **Google Authentication**: Users can sign up and log in using their Google accounts
- **Email/Password Authentication**: Users can sign up and log in with email and password
- **Account Linking**: Users who signed up with Google can set a password to use email login
- **Password Management**: Users can change their passwords or reset forgotten passwords
- **Profile Management**: Users can view and update their profile information
- **Institutional Restriction**: Only students from IIITL (Indian Institute of Information Technology, Lucknow) are allowed to register and login

## Technical Implementation

The authentication system is built using the following technologies:

- **NextAuth.js**: For authentication session management and providers
- **Mongoose**: For database interaction with MongoDB
- **bcrypt**: For secure password hashing

## Authentication Flow

### Google Sign-Up/Sign-In

1. User clicks "Sign in with Google" button
2. User is redirected to Google OAuth consent screen
3. After authentication, the system checks if the user already exists in the database
4. The system verifies that the email belongs to an IIITL student (ends with @iiitl.ac.in)
5. If the email is not from IIITL domain, access is denied with an appropriate message
6. If the user doesn't exist and has a valid IIITL email, a new account is created with their Google information
7. If the user hasn't set a password, they're prompted to create one
8. The user is redirected back to the application and authenticated

### Email/Password Sign-Up

1. User fills out the sign-up form with name, email, and password
2. System checks if the email already exists
3. System validates that the email belongs to an IIITL student (ends with @iiitl.ac.in)
4. If the email is not from IIITL domain, registration is rejected with an appropriate message
5. If the email is new and valid, the password is hashed, and a new user is created
6. User is automatically signed in after successful registration

### Email/Password Sign-In

1. User enters the email and password
2. System verifies the email exists, and the password is correct
3. After successful authentication, the user is redirected to the requested page.

### Setting Password for Google Users

1. Google users who try to sign in with email are redirected to a "Set Password" page
2. User creates a password for their account
3. The password is hashed and saved
4. User can now use either Google or email/password to sign in

## Security Considerations

- Passwords are never stored in plain text - they are hashed using bcrypt
- Session authentication uses JWT stored in HTTP-only cookies
- Sensitive operations require re-authentication
- User must be logged in to access protected routes
- Password reset functionality for account recovery
- Domain restriction ensures only IIITL students (@iiitl.ac.in email addresses) can log in/sign up to the platform. Others can only view.

## Environment Configuration

To use the authentication system, you must set the following environment variables:

```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_URL=your_app_url (e.g., http://localhost:3000 in development)
NEXTAUTH_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Authentication API Endpoints

- **POST /api/auth/register**: Register a new user with email/password
- **POST /api/auth/register-with-otp**: Register a new user with email verification
- **POST /api/auth/send-otp**: Send an OTP for email verification
- **POST /api/auth/verify-otp**: Verify an OTP
- **POST /api/auth/set-password**: Set a password for Google users
- **POST /api/auth/change-password**: Change password for authenticated users
- **POST /api/auth/forgot-password**: Initiate password reset process
- **POST /api/auth/reset-password**: Reset password using token
- **POST /api/auth/validate-reset-token**: Validate a password reset token
- **GET/POST /api/auth/[...nextauth]**: NextAuth.js authentication handlers
- **GET /api/auth/check-admin**: Check if the current user has admin privileges
- **GET /api/admin/roles**: Get paginated list of users with roles (admin only)
- **PATCH /api/admin/roles**: Promote or demote users (admin only)

## Components

- **AuthProvider**: Provides NextAuth session context to the application
- **AuthButton**: Displays login/signup buttons or user profile dropdown
- **SignIn/SignUp Pages**: User authentication forms
- **Profile Page**: Displays user information and settings
- **SetPassword Page**: Allows Google users to set a password

## Data Models

The User model includes fields for both Google authentication and email/password:

- **name**: User's full name
- **email**: User's email address (unique identifier)
- **password**: Hashed password (optional for Google users)
- **image**: User's profile image (from Google or uploaded)
- **googleId**: ID from Google authentication (for Google users)
- **passwordSet**: Boolean indicating if the user has set a password

## Role-Based Access Control (RBAC)

The system supports a role-based authentication and authorization system with two roles:

- **user**: Default role assigned to all registered users
- **admin**: Special role with additional privileges to manage users and access admin functionality

### User Model Role Implementation

The User model includes a `roles` field, which is an array of strings with possible values of `'user'` and `'admin'`.
All users are assigned the `'user'` role by default upon registration.

```typescript
roles: {
  type: [String],
  enum: ['user', 'admin'],
  default: ['user'],
}
```

### JWT and Session Security for Roles

The roles are securely stored in the JWT token and added to the user session. The implementation uses NextAuth's
JWT callback to securely add roles to the token, making it tamper-proof.

```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.sub = user.id
      token.roles = user.roles
    }
    return token
  },
  async session({ session, token }) {
    if (token.sub && session.user) {
      session.user.id = token.sub
    }
    if (token.roles && session.user) {
      session.user.roles = token.roles as string[]
    }
    return session
  },
}
```

### Middleware Protection for Admin Routes

A middleware is implemented to protect admin routes by validating the JWT token and checking for the admin role:

```typescript
export async function middleware(request: NextRequest) {
  // Check if this is an admin route that needs protection
  const isAdminRoute = ADMIN_PATHS.some((route) => path.startsWith(route))

  if (isAdminRoute) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // Check if the user has the admin role
    if (
      !token ||
      !Array.isArray(token.roles) ||
      !token.roles.includes('admin')
    ) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
  }
}
```

### Admin Capabilities

Admins can:

1. Access the admin dashboard at `/admin`
2. Navigate to user management at `/admin/users`
3. Promote regular users to admin or demote admins to regular users

### Utility Functions for Role Management

The system includes utility functions for role checking:

```typescript
// Check if a user has admin role
isAdmin(session: Session | null): boolean

// Verify admin status in API routes
verifyAdminApi(request: NextRequest): Promise<{status: number, message: string, success: boolean}>

// Verify JWT token security
verifyJwt(request: NextRequest): Promise<{verified: boolean, token?: JWT, userId?: string, roles?: string[]}>
```

### Security Considerations

- JWT tokens are signed with a secret to prevent tampering
- Admin-only routes are protected by middleware
- Role validation happens on both client and server sides
- All role operations are protected from unauthorized access
- Admin users cannot demote themselves to prevent accidental lockout
