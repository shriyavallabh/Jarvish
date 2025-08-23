// EUIN (Employee Unique Identification Number) validation for SEBI-registered advisors

export interface EUINValidationResult {
  isValid: boolean
  error?: string
  data?: {
    name?: string
    status?: string
    validTill?: string
    certifications?: string[]
  }
}

// Mock SEBI database for testing
const mockSEBIDatabase: Record<string, any> = {
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
}

export async function validateEUIN(euin: string): Promise<EUINValidationResult> {
  // Basic format validation
  if (!euin) {
    return { isValid: false, error: 'EUIN is required' }
  }

  // Check if starts with 'E' and is 10 characters long
  const euinPattern = /^E\d{9}$/
  if (!euinPattern.test(euin)) {
    return { isValid: false, error: 'Invalid EUIN format' }
  }

  // Simulate API call to SEBI database
  await new Promise(resolve => setTimeout(resolve, 100)) // Simulate network delay

  // Check in mock database
  const advisorData = mockSEBIDatabase[euin]
  
  if (!advisorData) {
    return { isValid: false, error: 'EUIN not found in SEBI database' }
  }

  if (advisorData.status !== 'active') {
    return { 
      isValid: false, 
      error: `EUIN status is ${advisorData.status}`,
      data: advisorData,
    }
  }

  return { 
    isValid: true,
    data: advisorData,
  }
}

export function isValidEUINFormat(euin: string): boolean {
  const euinPattern = /^E\d{9}$/
  return euinPattern.test(euin)
}