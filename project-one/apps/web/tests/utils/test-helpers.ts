import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a custom render function that includes providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

// Mock API responses
export function mockApiResponse(endpoint: string, data: any, status = 200) {
  return fetch.mockResponseOnce(JSON.stringify(data), { status })
}

// Mock API error
export function mockApiError(endpoint: string, error: string, status = 400) {
  return fetch.mockResponseOnce(JSON.stringify({ error }), { status })
}

// Wait for async operations
export async function waitForAsync() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Mock Clerk user
export function mockClerkUser(overrides = {}) {
  return {
    id: 'user_test123',
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [
      {
        emailAddress: 'test@example.com',
        verification: { status: 'verified' },
      },
    ],
    phoneNumbers: [
      {
        phoneNumber: '+919876543210',
        verification: { status: 'verified' },
      },
    ],
    publicMetadata: {
      role: 'advisor',
      euin: 'E123456789',
      onboardingCompleted: true,
    },
    ...overrides,
  }
}

// Mock form data
export function createFormData(data: Record<string, any>) {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, String(value))
    }
  })
  return formData
}

// Test database utilities
export class TestDatabase {
  private data: Map<string, any> = new Map()

  async create(collection: string, item: any) {
    const id = `${collection}_${Date.now()}_${Math.random()}`
    const itemWithId = { ...item, id }
    this.data.set(`${collection}:${id}`, itemWithId)
    return itemWithId
  }

  async findById(collection: string, id: string) {
    return this.data.get(`${collection}:${id}`) || null
  }

  async findByField(collection: string, field: string, value: any) {
    const items = Array.from(this.data.entries())
      .filter(([key]) => key.startsWith(`${collection}:`))
      .map(([, item]) => item)
      .filter(item => item[field] === value)
    return items[0] || null
  }

  async update(collection: string, id: string, updates: any) {
    const existing = await this.findById(collection, id)
    if (!existing) throw new Error('Item not found')
    const updated = { ...existing, ...updates }
    this.data.set(`${collection}:${id}`, updated)
    return updated
  }

  async delete(collection: string, id: string) {
    return this.data.delete(`${collection}:${id}`)
  }

  clear() {
    this.data.clear()
  }
}

// Performance testing utilities
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()

  mark(name: string) {
    this.marks.set(name, performance.now())
  }

  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark)
    const end = endMark ? this.marks.get(endMark) : performance.now()
    
    if (!start) throw new Error(`Start mark "${startMark}" not found`)
    if (endMark && !end) throw new Error(`End mark "${endMark}" not found`)
    
    return end! - start
  }

  clear() {
    this.marks.clear()
  }
}

// Network simulation
export function simulateNetwork(type: 'slow3g' | '4g' | 'wifi' = 'wifi') {
  const delays = {
    slow3g: 2000,
    '4g': 500,
    wifi: 100,
  }
  
  return new Promise(resolve => setTimeout(resolve, delays[type]))
}

// SEBI compliance checker mock
export class MockSEBIComplianceChecker {
  private violations = new Map<string, string[]>()

  addViolation(content: string, violations: string[]) {
    this.violations.set(content, violations)
  }

  async check(content: string) {
    const violations = this.violations.get(content) || []
    return {
      isCompliant: violations.length === 0,
      violations,
      score: violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 20),
    }
  }

  clear() {
    this.violations.clear()
  }
}

// WhatsApp API mock
export class MockWhatsAppAPI {
  private messages: any[] = []
  private templates: Map<string, any> = new Map()

  async sendMessage(to: string, message: string, templateId?: string) {
    const msg = {
      id: `msg_${Date.now()}`,
      to,
      message,
      templateId,
      status: 'sent',
      timestamp: new Date().toISOString(),
    }
    this.messages.push(msg)
    return msg
  }

  async submitTemplate(template: any) {
    const id = `template_${Date.now()}`
    const submittedTemplate = {
      ...template,
      id,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    }
    this.templates.set(id, submittedTemplate)
    return submittedTemplate
  }

  async getTemplateStatus(id: string) {
    return this.templates.get(id) || null
  }

  getMessages() {
    return this.messages
  }

  clear() {
    this.messages = []
    this.templates.clear()
  }
}

// Email service mock
export class MockEmailService {
  private emails: any[] = []

  async sendVerificationEmail(to: string, token: string) {
    const email = {
      id: `email_${Date.now()}`,
      to,
      subject: 'Verify your email',
      token,
      type: 'verification',
      sentAt: new Date().toISOString(),
    }
    this.emails.push(email)
    return email
  }

  async sendWelcomeEmail(to: string, name: string) {
    const email = {
      id: `email_${Date.now()}`,
      to,
      subject: `Welcome to Jarvish, ${name}!`,
      type: 'welcome',
      sentAt: new Date().toISOString(),
    }
    this.emails.push(email)
    return email
  }

  getEmails() {
    return this.emails
  }

  clear() {
    this.emails = []
  }
}

// OTP service mock
export class MockOTPService {
  private otps: Map<string, string> = new Map()

  async generate(mobile: string) {
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    this.otps.set(mobile, otp)
    return otp
  }

  async verify(mobile: string, otp: string) {
    const storedOtp = this.otps.get(mobile)
    return storedOtp === otp
  }

  clear() {
    this.otps.clear()
  }
}

// Export all utilities
export * from '@testing-library/react'
export { waitFor, screen, fireEvent } from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'