import { randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

interface TokenPayload {
  userId: string
  email: string
  type: string
}

export function generateVerificationToken(payload: TokenPayload): string {
  // For email verification, we use a random token instead of JWT
  // This is more secure for one-time use tokens
  if (payload.type === 'email-verification') {
    return randomBytes(32).toString('hex')
  }
  
  // For other token types, use JWT
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
  })
}

export function validateVerificationToken(token: string): {
  isValid: boolean
  userId?: string
  email?: string
  error?: string
} {
  try {
    // For random tokens, validation happens in the database
    // This function is mainly for JWT tokens
    
    if (token.length === 64) {
      // Likely a hex token for email verification
      // Actual validation happens in EmailVerificationService
      return { isValid: true, userId: 'pending-db-check' }
    }
    
    // Validate JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    
    return {
      isValid: true,
      userId: decoded.userId,
      email: decoded.email,
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { isValid: false, error: 'Token expired' }
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { isValid: false, error: 'Invalid token' }
    }
    return { isValid: false, error: 'Token validation failed' }
  }
}

export function generateOTP(): string {
  // Generate 6-digit OTP for mobile verification
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function generateSessionToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'session' },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function validateSessionToken(token: string): {
  isValid: boolean
  userId?: string
} {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return { isValid: true, userId: decoded.userId }
  } catch {
    return { isValid: false }
  }
}