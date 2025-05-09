import zxcvbn from 'zxcvbn'
import DOMPurify from 'dompurify'

// Password strength scoring
export function calculatePasswordStrength(password: string): number {
  // Use zxcvbn for a more comprehensive password strength check
  const result = zxcvbn(password)
  return result.score
}

// Generate secure random token using Web Crypto API
export async function generateSecureToken(
  length: number = 32
): Promise<string> {
  const array = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    console.error('Crypto API not available')
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
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    } else {
      console.error('Crypto API not available')
      throw new Error('Cryptographic API not available')
    }
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
  // Handle IPv4 with port
  if (ip.includes('.') && ip.includes(':')) {
    ip = ip.substring(0, ip.lastIndexOf(':'))
  }
  // Handle IPv6 with port - IPv6 with port is typically formatted as [IPv6]:port
  else if (ip.includes('[') && ip.includes(']:')) {
    ip = ip.substring(1, ip.indexOf(']'))
  }

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

// Sanitize user input with DOMPurify for production-grade XSS protection
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input.trim())
}

// Generate device fingerprint
export async function generateDeviceFingerprint(
  userAgent: string,
  ip: string
): Promise<string> {
  // Note: This provides a basic fingerprint, but both userAgent and IP can be spoofed
  // For higher security, consider additional signals or a specialized fingerprinting library
  const data = `${userAgent}${ip}`
  return hashSensitiveData(data)
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
  // Note: This detection relies on user agent which can be spoofed
  // For more reliable detection, consider:
  // 1. IP reputation checking
  // 2. Behavioral analysis
  // 3. CAPTCHA for suspicious requests
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /slurp/i,
    /searchbot/i,
    /mediapartners/i,
    /nagios/i,
    /monitoring/i,
    /^curl\//i,
    /^wget\//i,
    /^python-requests\//i,
    /^java\//i,
    /^perl/i,
    /^ruby/i,
    /HeadlessChrome/i,
    /PhantomJS/i,
  ]

  // Whitelist known legitimate bots
  const whitelistedBots = [/googlebot/i, /bingbot/i, /yandexbot/i]

  // Check if it's a whitelisted bot
  if (whitelistedBots.some((pattern) => pattern.test(userAgent))) {
    return false
  }

  return botPatterns.some((pattern) => pattern.test(userAgent))
}

// Rate limit helper
export function calculateBackoff(attempts: number): number {
  return Math.min(1000 * Math.pow(2, attempts), 300000) // Max 5 minutes
}

// Validate email format
export function isValidEmailFormat(email: string): boolean {
  // More comprehensive email regex that enforces TLD rules
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
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
