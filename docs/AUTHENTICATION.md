# Student Hub Authentication System

The Student Hub application uses a flexible authentication system that supports both Google OAuth and traditional email/password authentication. The system is designed to allow users who sign up with Google to also set a password for email-based login.

## Features

- **Google Authentication**: Users can sign up and log in using their Google accounts
- **Email/Password Authentication**: Users can sign up and log in with email and password
- **Account Linking**: Users who signed up with Google can set a password to use email login
- **Password Management**: Users can change their passwords or reset forgotten passwords
- **Profile Management**: Users can view and update their profile information

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
4. If the user doesn't exist, a new account is created with their Google information
5. The user is redirected back to the application and authenticated

### Email/Password Sign-Up

1. User fills out the sign-up form with name, email, and password
2. System checks if the email already exists
3. If the email is new, the password is hashed and a new user is created
4. User is automatically signed in after successful registration

### Email/Password Sign-In

1. User enters email and password
2. System verifies the email exists and password is correct
3. If the user signed up with Google but hasn't set a password, they're prompted to create one
4. After successful authentication, the user is redirected to the requested page

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

## Environment Configuration

To use the authentication system, you must set the following environment variables:

```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_URL=your_app_url (e.g., http://localhost:3000 in development)
NEXTAUTH_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Authentication API Endpoints

- **POST /api/auth/register**: Register a new user with email/password
- **POST /api/auth/set-password**: Set a password for Google users
- **POST /api/auth/change-password**: Change password for authenticated users

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