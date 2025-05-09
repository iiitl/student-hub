import crypto from 'crypto'

// Password strength scoring
export function calculatePasswordStrength(password: string): number {
  let score = 0

  // Length check
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Character type checks
  if (/[A-Z]/.test(password)) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  // Complexity checks
  if (/(.)\1{2,}/.test(password)) score -= 1 // Penalize repeated characters
  if (/^(.)\1+$/.test(password)) score -= 2 // Penalize single character repetition

  // Keyboard pattern check
  if (/qwerty|asdfgh|zxcvbn|12345|54321/i.test(password)) score -= 1

  // Sequential characters check
  if (/abcdef|ABCDEF|123456/i.test(password)) score -= 1

  return Math.max(0, Math.min(5, score))
}

// Generate secure random token using Web Crypto API
export async function generateSecureToken(
  length: number = 32
): Promise<string> {
  const array = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else if (typeof crypto !== 'undefined') {
    try {
      // Use Node.js crypto if available
      const bytes = crypto.randomBytes(length)
      array.set(new Uint8Array(bytes))
    } catch (error) {
      console.error('Error generating random bytes:', error)
      throw new Error('Secure random number generation not available')
    }
  } else {
    throw new Error('Secure random number generation not available')
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  )
}

// Hash sensitive data using Web Crypto API
export async function hashSensitiveData(data: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    let hashBuffer

    // Check if we're in a browser or Node.js environment
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    } else if (typeof crypto !== 'undefined') {
      const hash = crypto.createHash('sha256')
      hash.update(data)
      return hash.digest('hex')
    } else {
      throw new Error('Cryptographic API not available')
    }

    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  } catch (error) {
    throw new Error(
      `Failed to hash data: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

// Validate IP address
export function isValidIP(ip: string): boolean {
  // Allow localhost and 'unknown' IPs
  if (ip === '127.0.0.1' || ip === 'unknown') return true

  // Remove port number if present
  ip = ip.split(':')[0]

  // IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.')
    return parts.every((part) => {
      const num = parseInt(part)
      return num >= 0 && num <= 255
    })
  }

  // More comprehensive IPv6 validation
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:))|(([0-9a-fA-F]{1,4}:){6}(:[0-9a-fA-F]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-fA-F]{1,4}:){5}(((:[0-9a-fA-F]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-fA-F]{1,4}:){4}(((:[0-9a-fA-F]{1,4}){1,3})|((:[0-9a-fA-F]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-fA-F]{1,4}:){3}(((:[0-9a-fA-F]{1,4}){1,4})|((:[0-9a-fA-F]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-fA-F]{1,4}:){2}(((:[0-9a-fA-F]{1,4}){1,5})|((:[0-9a-fA-F]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-fA-F]{1,4}:){1}(((:[0-9a-fA-F]{1,4}){1,6})|((:[0-9a-fA-F]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-fA-F]{1,4}){1,7})|((:[0-9a-fA-F]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))$/

  // Check IPv6 format
  if (ipv6Regex.test(ip)) {
    return true
  }

  // Support for IPv6 localhost
  return ip === '::1'
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  // This is a basic implementation and should be replaced with a proper sanitization library
  let sanitized = input.trim()
  // More comprehensive attempt to remove dangerous HTML
  sanitized = sanitized
    .replace(/<(|\/|[^\/>][^>]+|\/[^>][^>]+)>/g, '')
    // Remove potentially dangerous protocols
    .replace(/(javascript|data|vbscript):/gi, '')
    // Remove all event handlers
    .replace(/on\w+\s*=\s*["']?[^"']*["']?/gi, '')
    // Remove dangerous CSS expressions
    .replace(/expression\s*\(.*\)/gi, '')
    // Remove eval and other dangerous functions
    .replace(/eval\s*\(.*\)/gi, '')

  return sanitized
}

// Generate device fingerprint
export async function generateDeviceFingerprint(
  userAgent: string,
  ip: string
): Promise<string> {
  const data = `${userAgent}${ip}`
  return hashSensitiveData(data)
}

// Check if password is in common passwords list
export function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password',
    '123456',
    'qwerty',
    'admin',
    'welcome',
    'letmein',
    '123456789',
    '12345678',
    '12345',
    '1234567',
    '1234567890',
    'abc123',
    'football',
    'monkey',
    '111111',
    'password1',
    'sunshine',
    'princess',
    'dragon',
    'baseball',
    // Consider loading from a larger file or using an API service
  ]

  // Check for exact matches and simple variations
  const lowercasePassword = password.toLowerCase()
  if (commonPasswords.includes(lowercasePassword)) return true

  // Check for passwords with added digits
  if (/^[a-z]+\d+$/i.test(password)) {
    const baseWord = password.replace(/\d+$/, '').toLowerCase()
    if (commonPasswords.includes(baseWord)) return true
  }

  return false
}

// Validate session token
export function validateSessionToken(token: string): boolean {
  // Basic format validation
  const jwtRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/
  if (!jwtRegex.test(token)) {
    return false
  }

  // Additional structural checks
  const parts = token.split('.')
  if (parts.length !== 3) {
    return false
  }

  try {
    // Validate header and payload are valid base64url JSON
    JSON.parse(Buffer.from(parts[0], 'base64url').toString())
    JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    return true
  } catch (e) {
    console.error('Invalid JWT structure:', e)
    return false
  }
}

// Check if request is from a known bot
export function isKnownBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /slurp/i,
    /search/i,
    /mediapartners/i,
    /nagios/i,
    /monitoring/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /perl/i,
    /ruby/i,
  ]
  return botPatterns.some((pattern) => pattern.test(userAgent))
}

// Rate limit helper
export function calculateBackoff(attempts: number): number {
  return Math.min(1000 * Math.pow(2, attempts), 300000) // Max 5 minutes
}

// Validate email format
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Check if password meets minimum requirements
export function meetsPasswordRequirements(password: string): boolean {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  )
}
