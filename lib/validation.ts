import {
  isValidEmailFormat,
  meetsPasswordRequirements,
  isCommonPassword,
  calculatePasswordStrength,
} from './security'

/**
 * Regular expression for password validation.
 * Requires at least:
 * - 8 characters
 * - One uppercase letter
 * - One lowercase letter
 * - One number
 * - One special character
 */
export const PASSWORD_REGEX =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#\.?!@$%^&*()/\\\[\]{}~`+=,<|>;:'"-]).{8,}$/

/**
 * Validates a password against the password requirements.
 * @param password - The password to validate
 * @returns null if valid, error message if invalid
 */
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required'
  }

  if (!meetsPasswordRequirements(password)) {
    return 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters'
  }

  if (isCommonPassword(password)) {
    return 'This password is too common. Please choose a stronger password'
  }

  const strength = calculatePasswordStrength(password)
  if (strength < 3) {
    return 'Password is too weak. Please choose a stronger password'
  }

  return null
}

/**
 * Validates an email address format and domain.
 * Ensures the email:
 * - Is not empty
 * - Has valid email format
 * - Uses the IIITL domain
 * @param email - The email address to validate
 * @returns null if valid, error message if invalid
 */
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Email is required'
  }

  const sanitizedEmail = email.trim().toLowerCase()

  if (!isValidEmailFormat(sanitizedEmail)) {
    return 'Invalid email format'
  }

  if (!sanitizedEmail.endsWith('@iiitl.ac.in')) {
    return 'Only IIITL email addresses are allowed'
  }

  return null
}

/**
 * Regular expression for OTP validation
 * Ensures exactly 6 digits
 */
const OTP_REGEX = /^\d{6}$/

/**
 * Validates a one-time password (OTP).
 * Ensures the OTP:
 * - Is not empty
 * - Contains exactly 6 digits
 * @param otp - The OTP to validate
 * @returns null if valid, error message if invalid
 */
export const validateOTP = (otp: string): string | null => {
  if (!otp) {
    return 'OTP is required'
  }

  if (!OTP_REGEX.test(otp)) {
    return 'OTP must be 6 digits'
  }

  return null
}

/**
 * Validates a user's name.
 * Ensures the name:
 * - Is not empty
 * - Is between 2 and 50 characters long
 * @param name - The name to validate
 * @returns null if valid, error message if invalid
 */
export const validateName = (name: string): string | null => {
  if (!name) {
    return 'Name is required'
  }

  const sanitizedName = name.trim()

  if (sanitizedName.length < 2) {
    return 'Name must be at least 2 characters long'
  }

  if (sanitizedName.length > 100) {
    return 'Name cannot be more than 100 characters'
  }

  if (!/^[a-zA-Z\s-']+$/.test(sanitizedName)) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes'
  }

  return null
}

/**
 * Validates that two passwords match.
 * Used for password confirmation during registration or password change.
 * @param password - The main password
 * @param confirmPassword - The confirmation password
 * @returns null if matching, error message if not matching
 */
export const validatePasswordsMatch = (
  password: string,
  confirmPassword: string
): string | null => {
  if (password !== confirmPassword) {
    return 'Passwords do not match'
  }
  return null
}

/**
 * Validates that a new password is different from the current password.
 * Used during password change to ensure the new password is different.
 * @param currentPassword - The user's current password
 * @param newPassword - The new password to set
 * @returns null if different, error message if same
 */
export const validateNewPasswordDifferent = (
  currentPassword: string,
  newPassword: string
): string | null => {
  if (currentPassword === newPassword) {
    return 'New password must be different from current password'
  }
  return null
}

export function validateToken(token: string): string | null {
  if (!token) {
    return 'Token is required'
  }

  if (token.length < 32) {
    return 'Invalid token format'
  }

  return null
}

export function validateImageUrl(url: string): string | null {
  if (!url) {
    return null // Image is optional
  }

  if (!url.startsWith('https://')) {
    return 'Image URL must use HTTPS'
  }

  try {
    new URL(url)
  } catch {
    return 'Invalid image URL format'
  }

  return null
}
