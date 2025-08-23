// SEBI Compliance Validator for financial advisors and content

export interface ComplianceResult {
  isCompliant: boolean
  violations?: string[]
  score?: number
  recommendations?: string[]
}

export interface AdvisorData {
  euin: string
  firstName: string
  lastName: string
  certifications?: string[]
  businessType?: string
  yearsOfExperience?: number
}

export class SEBIComplianceValidator {
  private requiredCertifications = ['NISM-Series-VA']
  private prohibitedTerms = [
    'guaranteed returns',
    'risk-free',
    'double your money',
    'hot tip',
    'insider information',
    'assured profit',
    '100% safe',
  ]

  async validateAdvisorData(data: AdvisorData): Promise<ComplianceResult> {
    const violations: string[] = []

    // Check required fields
    if (!data.euin) {
      violations.push('EUIN is required for SEBI compliance')
    }

    if (!data.firstName || !data.lastName) {
      violations.push('Full name is required for registration')
    }

    // Check certifications (if provided)
    if (data.certifications && data.certifications.length > 0) {
      const hasRequiredCert = this.requiredCertifications.some(cert =>
        data.certifications?.includes(cert)
      )
      
      if (!hasRequiredCert) {
        violations.push('Missing required NISM certification')
      }
    }

    // Check business type
    if (data.businessType && !['individual', 'partnership', 'company', 'llp'].includes(data.businessType)) {
      violations.push('Invalid business type')
    }

    return {
      isCompliant: violations.length === 0,
      violations: violations.length > 0 ? violations : undefined,
      score: 100 - (violations.length * 20),
    }
  }

  async validateContent(content: string): Promise<ComplianceResult> {
    const violations: string[] = []
    const contentLower = content.toLowerCase()

    // Check for prohibited terms
    for (const term of this.prohibitedTerms) {
      if (contentLower.includes(term)) {
        violations.push(`Prohibited term found: "${term}"`)
      }
    }

    // Check for required disclaimers
    const hasRiskDisclaimer = contentLower.includes('market risk') || 
                             contentLower.includes('subject to market risks')
    
    if (!hasRiskDisclaimer && contentLower.includes('investment')) {
      violations.push('Missing required risk disclaimer for investment content')
    }

    // Check for scheme document disclaimer
    const hasSchemeDocs = contentLower.includes('scheme document') ||
                         contentLower.includes('offer document')
    
    if (!hasSchemeDocs && contentLower.includes('mutual fund')) {
      violations.push('Missing scheme document disclaimer for mutual fund content')
    }

    return {
      isCompliant: violations.length === 0,
      violations: violations.length > 0 ? violations : undefined,
      score: Math.max(0, 100 - (violations.length * 15)),
      recommendations: this.getRecommendations(violations),
    }
  }

  private getRecommendations(violations: string[]): string[] {
    const recommendations: string[] = []

    if (violations.some(v => v.includes('risk disclaimer'))) {
      recommendations.push('Add disclaimer: "Mutual fund investments are subject to market risks. Please read all scheme related documents carefully."')
    }

    if (violations.some(v => v.includes('scheme document'))) {
      recommendations.push('Add disclaimer: "Please read the scheme information document carefully before investing."')
    }

    if (violations.some(v => v.includes('Prohibited term'))) {
      recommendations.push('Remove any guarantees or promises of returns. Focus on educational content.')
    }

    return recommendations
  }

  async validateCompleteRegistration(data: any): Promise<ComplianceResult> {
    const violations: string[] = []

    // Validate all required fields for SEBI compliance
    const requiredFields = [
      'euin',
      'firstName',
      'lastName',
      'email',
      'mobile',
      'businessType',
      'termsAccepted',
      'dpdpConsent',
    ]

    for (const field of requiredFields) {
      if (!data[field]) {
        violations.push(`Missing required field: ${field}`)
      }
    }

    // Validate terms acceptance
    if (data.termsAccepted !== true) {
      violations.push('Terms and conditions must be accepted')
    }

    if (data.dpdpConsent !== true) {
      violations.push('DPDP Act consent is required')
    }

    // Validate mobile number format (Indian)
    if (data.mobile && !this.isValidIndianMobile(data.mobile)) {
      violations.push('Invalid Indian mobile number format')
    }

    return {
      isCompliant: violations.length === 0,
      violations: violations.length > 0 ? violations : undefined,
      score: Math.max(0, 100 - (violations.length * 10)),
    }
  }

  private isValidIndianMobile(mobile: string): boolean {
    const cleaned = mobile.replace(/[\s-]/g, '')
    const patterns = [
      /^\+91[6-9]\d{9}$/,
      /^91[6-9]\d{9}$/,
      /^0?[6-9]\d{9}$/,
    ]
    return patterns.some(pattern => pattern.test(cleaned))
  }
}

export default SEBIComplianceValidator