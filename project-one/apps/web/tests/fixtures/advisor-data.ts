// Test fixtures for advisor registration and related tests

export const validAdvisorData = {
  euin: 'E123456789',
  firstName: 'Rajesh',
  lastName: 'Kumar',
  email: 'rajesh.kumar@example.com',
  mobile: '+919876543210',
  password: 'SecurePass123!',
  businessType: 'individual',
  firmName: 'Kumar Financial Services',
  address: {
    line1: '123 MG Road',
    line2: 'Near City Mall',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India',
  },
  specialization: ['equity_funds', 'debt_funds', 'tax_planning'],
  yearsOfExperience: 10,
  certifications: ['NISM-Series-VA', 'NISM-Series-XA'],
  languagePreference: ['hindi', 'english'],
  clientSegment: 'retail',
  aum: 50000000, // 5 crores
  activeClients: 150,
}

export const invalidEUINData = [
  { euin: '123456789', error: 'Missing E prefix' },
  { euin: 'E12345', error: 'Too short' },
  { euin: 'EINVALID', error: 'Invalid format' },
  { euin: 'E1234567890', error: 'Too long' },
  { euin: '', error: 'Empty EUIN' },
  { euin: null, error: 'Null EUIN' },
]

export const invalidMobileNumbers = [
  { mobile: '1234567890', error: 'Missing country code' },
  { mobile: '+1234567890', error: 'Non-Indian number' },
  { mobile: '+91123456789', error: 'Invalid length' },
  { mobile: '+9112345678901', error: 'Too long' },
  { mobile: 'abcdefghij', error: 'Non-numeric' },
]

export const weakPasswords = [
  { password: 'weak', error: 'Too short' },
  { password: '12345678', error: 'No letters' },
  { password: 'abcdefgh', error: 'No numbers' },
  { password: 'Abcd1234', error: 'No special characters' },
  { password: 'abcd1234!', error: 'No uppercase' },
  { password: 'ABCD1234!', error: 'No lowercase' },
]

export const sebiViolations = [
  {
    content: 'Guaranteed 20% returns on investments',
    violation: 'Guaranteed returns promise',
    code: 'SEBI_001',
  },
  {
    content: 'Risk-free investment opportunity',
    violation: 'Risk-free claim',
    code: 'SEBI_002',
  },
  {
    content: 'Double your money in 6 months',
    violation: 'Unrealistic return promise',
    code: 'SEBI_003',
  },
  {
    content: 'Hot tip: Buy XYZ stock now!',
    violation: 'Unauthorized stock recommendation',
    code: 'SEBI_004',
  },
]

export const validContentExamples = [
  {
    content: 'SIP investments help in rupee cost averaging. Mutual fund investments are subject to market risks.',
    type: 'educational',
    compliance: true,
  },
  {
    content: 'Tax-saving ELSS funds offer dual benefits of tax deduction and wealth creation. Please read scheme documents carefully.',
    type: 'informational',
    compliance: true,
  },
  {
    content: 'Diversification across asset classes can help manage portfolio risk. Past performance may not be indicative of future results.',
    type: 'educational',
    compliance: true,
  },
]

export const businessTypes = [
  { value: 'individual', label: 'Individual Advisor' },
  { value: 'partnership', label: 'Partnership Firm' },
  { value: 'company', label: 'Company' },
  { value: 'llp', label: 'Limited Liability Partnership' },
]

export const specializationOptions = [
  { value: 'equity_funds', label: 'Equity Funds' },
  { value: 'debt_funds', label: 'Debt Funds' },
  { value: 'hybrid_funds', label: 'Hybrid Funds' },
  { value: 'tax_planning', label: 'Tax Planning' },
  { value: 'retirement_planning', label: 'Retirement Planning' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'nri_services', label: 'NRI Services' },
  { value: 'wealth_management', label: 'Wealth Management' },
]

export const certificationOptions = [
  { value: 'NISM-Series-VA', label: 'NISM Series V-A: Mutual Fund Distributors' },
  { value: 'NISM-Series-XA', label: 'NISM Series X-A: Investment Adviser (Level 1)' },
  { value: 'NISM-Series-XB', label: 'NISM Series X-B: Investment Adviser (Level 2)' },
  { value: 'CFP', label: 'Certified Financial Planner' },
  { value: 'CWM', label: 'Chartered Wealth Manager' },
]

export const mockSEBIDatabase = {
  'E123456789': {
    name: 'Rajesh Kumar',
    status: 'active',
    validTill: '2025-12-31',
    certifications: ['NISM-Series-VA'],
  },
  'E987654321': {
    name: 'Priya Sharma',
    status: 'active',
    validTill: '2024-06-30',
    certifications: ['NISM-Series-VA', 'NISM-Series-XA'],
  },
  'E111111111': {
    name: 'Expired Advisor',
    status: 'expired',
    validTill: '2023-12-31',
    certifications: ['NISM-Series-VA'],
  },
  'E222222222': {
    name: 'Suspended Advisor',
    status: 'suspended',
    validTill: '2025-12-31',
    certifications: ['NISM-Series-VA'],
  },
}

export const mockOTPCodes = {
  '+919876543210': '123456',
  '+919876543211': '654321',
  '+919876543212': '111111',
}

// Helper function to generate unique test data
export function generateUniqueAdvisor(overrides = {}) {
  const timestamp = Date.now()
  return {
    ...validAdvisorData,
    email: `test.${timestamp}@example.com`,
    mobile: `+9198765${String(timestamp).slice(-5)}`,
    ...overrides,
  }
}

// Helper function to simulate SEBI API response
export function mockSEBIApiResponse(euin: string) {
  const advisorData = mockSEBIDatabase[euin]
  
  if (!advisorData) {
    return {
      success: false,
      error: 'EUIN not found in SEBI database',
    }
  }
  
  if (advisorData.status !== 'active') {
    return {
      success: false,
      error: `EUIN status is ${advisorData.status}`,
      data: advisorData,
    }
  }
  
  return {
    success: true,
    data: advisorData,
  }
}

// Helper function to validate Indian mobile number
export function isValidIndianMobile(mobile: string): boolean {
  // Remove spaces and hyphens
  const cleaned = mobile.replace(/[\s-]/g, '')
  
  // Check for valid Indian mobile patterns
  const patterns = [
    /^(\+91)?[6-9]\d{9}$/, // +91 followed by 10 digits starting with 6-9
    /^0?[6-9]\d{9}$/, // Optional 0 followed by 10 digits
  ]
  
  return patterns.some(pattern => pattern.test(cleaned))
}

// Helper function to validate password strength
export function validatePasswordStrength(password: string) {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }
  
  const strength = Object.values(checks).filter(Boolean).length
  const isValid = Object.values(checks).every(Boolean)
  
  return {
    isValid,
    strength: strength === 5 ? 'strong' : strength >= 3 ? 'medium' : 'weak',
    checks,
  }
}