/**
 * Profile validation utilities
 * Ensures all profile data meets SEBI and business requirements
 */

interface ProfileValidationResult {
  valid: boolean
  errors?: string[]
}

/**
 * Validate complete profile data
 */
export function validateProfile(profileData: any): ProfileValidationResult {
  const errors: string[] = []
  
  // Required fields validation
  if (!profileData.firmName || profileData.firmName.trim().length === 0) {
    errors.push('Firm name is required')
  }
  
  if (profileData.firmName && profileData.firmName.length > 100) {
    errors.push('Firm name must be less than 100 characters')
  }
  
  // Experience validation
  if (profileData.experience !== undefined) {
    if (profileData.experience < 0) {
      errors.push('Experience must be positive')
    }
    if (profileData.experience > 50) {
      errors.push('Experience seems invalid (>50 years)')
    }
  }
  
  // Registration number validation
  if (profileData.firmRegistrationNumber) {
    const regNumValid = validateRegistrationNumber(profileData.firmRegistrationNumber)
    if (!regNumValid.valid) {
      errors.push(regNumValid.error || 'Invalid SEBI registration number format')
    }
  }
  
  // Client count validation
  if (profileData.clientCount !== undefined) {
    if (profileData.clientCount < 0) {
      errors.push('Client count must be positive')
    }
    if (profileData.clientCount > 10000) {
      errors.push('Client count seems invalid (>10,000)')
    }
  }
  
  // AUM validation (in INR)
  if (profileData.aum !== undefined) {
    if (profileData.aum < 0) {
      errors.push('AUM must be positive')
    }
  }
  
  // Specializations validation
  if (profileData.specializations && profileData.specializations.length > 10) {
    errors.push('Maximum 10 specializations allowed')
  }
  
  // Languages validation
  if (profileData.languages && profileData.languages.length > 5) {
    errors.push('Maximum 5 languages allowed')
  }
  
  // Location validation
  if (profileData.location) {
    if (!profileData.location.city) {
      errors.push('City is required in location')
    }
    if (!profileData.location.state) {
      errors.push('State is required in location')
    }
    if (profileData.location.pincode && !/^\d{6}$/.test(profileData.location.pincode)) {
      errors.push('Invalid pincode format (must be 6 digits)')
    }
  }
  
  // Contact info validation
  if (profileData.contactInfo) {
    if (profileData.contactInfo.businessPhone) {
      const phoneValid = validateIndianPhoneNumber(profileData.contactInfo.businessPhone)
      if (!phoneValid) {
        errors.push('Invalid phone number format')
      }
    }
    
    if (profileData.contactInfo.businessEmail) {
      const emailValid = validateEmail(profileData.contactInfo.businessEmail)
      if (!emailValid) {
        errors.push('Invalid email format')
      }
    }
    
    if (profileData.contactInfo.website) {
      const urlValid = validateURL(profileData.contactInfo.website)
      if (!urlValid) {
        errors.push('Invalid website URL')
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Validate SEBI registration number (EUIN/ARN)
 */
export function validateRegistrationNumber(number: string): { valid: boolean; error?: string } {
  if (!number) {
    return { valid: false, error: 'Registration number is required' }
  }
  
  // Check for EUIN format (E followed by 6 digits)
  const euinRegex = /^E\d{6}$/
  if (euinRegex.test(number)) {
    return { valid: true }
  }
  
  // Check for ARN format (ARN- followed by 5 digits)
  const arnRegex = /^ARN-\d{5}$/
  if (arnRegex.test(number)) {
    return { valid: true }
  }
  
  // Check for RIA format
  const riaRegex = /^INA\d{9}$/
  if (riaRegex.test(number)) {
    return { valid: true }
  }
  
  return {
    valid: false,
    error: 'Invalid SEBI registration number format. Expected formats: E123456, ARN-12345, or INA123456789',
  }
}

/**
 * Validate Indian phone number
 */
export function validateIndianPhoneNumber(phone: string): boolean {
  if (!phone) return false
  
  // Remove spaces, hyphens, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  // Check length
  if (cleaned.length < 10 || cleaned.length > 13) return false
  
  // Check for Indian mobile number format
  // Can start with +91, 91, or directly with 6-9
  const mobileRegex = /^(\+91|91)?[6-9]\d{9}$/
  
  // Must match exactly
  return mobileRegex.test(cleaned)
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL
 */
export function validateURL(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Validate hex color code
 */
export function validateHexColor(color: string): boolean {
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
  return hexColorRegex.test(color)
}

/**
 * Validate Indian pincode
 */
export function validatePincode(pincode: string): boolean {
  const pincodeRegex = /^[1-9]\d{5}$/
  return pincodeRegex.test(pincode)
}

/**
 * Validate PAN card number
 */
export function validatePAN(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan.toUpperCase())
}

/**
 * Validate GST number
 */
export function validateGST(gst: string): boolean {
  if (!gst || gst.length !== 15) return false
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return gstRegex.test(gst.toUpperCase())
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return ''
  
  // Remove script tags and other harmful content
  let sanitized = String(input)
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '') // Remove all HTML tags
    .replace(/[\r\n]/g, '') // Remove line breaks
    .trim() // Trim whitespace
  
  return sanitized
}

/**
 * Validate phone number (alias for validateIndianPhoneNumber)
 */
export function validatePhoneNumber(phone: string): boolean {
  return validateIndianPhoneNumber(phone)
}

/**
 * Validate EUIN (Employee Unique Identification Number)
 * Format: E + 6 digits (e.g., E123456)
 */
export function validateEUIN(euin: string): boolean {
  const euinRegex = /^E\d{6}$/
  return euinRegex.test(euin)
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  // At least 8 characters, one uppercase, one lowercase, one number, one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  
  return {
    isValid: passwordRegex.test(password),
    errors
  }
}

/**
 * Validate business name
 */
export function validateBusinessName(name: string): boolean {
  if (!name || name.trim().length === 0) return false
  const trimmed = name.trim()
  if (trimmed.length < 3 || trimmed.length > 100) return false
  // Allow letters, numbers, spaces, and common business symbols
  const nameRegex = /^[a-zA-Z0-9\s\-&.,()]+$/
  return nameRegex.test(trimmed)
}

/**
 * Validate content length for different platforms
 */
export function validateContentLength(content: string, type?: 'whatsapp' | 'twitter' | 'linkedin' | string): boolean {
  if (!content) return false
  
  const limits: { [key: string]: number } = {
    whatsapp: 1024,
    twitter: 280,
    linkedin: 3000,
    default: 5000
  }
  
  const maxLength = limits[type || 'default'] || limits.default
  return content.length > 0 && content.length <= maxLength
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: {
  size: number
  mimetype: string
}): { valid: boolean; error?: string } {
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
  ]
  
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds 5MB limit',
    }
  }
  
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: 'Invalid file type',
    }
  }
  
  return { valid: true }
}