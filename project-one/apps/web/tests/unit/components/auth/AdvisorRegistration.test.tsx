import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdvisorRegistrationForm } from '@/components/auth/AdvisorRegistrationForm'
import { validateEUIN } from '@/lib/validators/euin'
import { SEBIComplianceValidator } from '@/lib/validators/sebi-compliance'

// Mock the validators
jest.mock('@/lib/validators/euin')
jest.mock('@/lib/validators/sebi-compliance')

describe('E01-US-001: Advisor Registration', () => {
  const mockOnSubmit = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(validateEUIN as jest.Mock).mockResolvedValue({ isValid: true })
    ;(SEBIComplianceValidator as jest.Mock).mockImplementation(() => ({
      validateAdvisorData: jest.fn().mockResolvedValue({ isCompliant: true }),
    }))
  })

  describe('TC-E01-001-01: Valid EUIN registration success', () => {
    it.skip('should successfully register an advisor with valid EUIN', async () => {
      const user = userEvent.setup()
      
      render(
        <AdvisorRegistrationForm 
          onSubmit={mockOnSubmit}
          onError={mockOnError}
        />
      )

      // Fill in the registration form
      await user.type(screen.getByLabelText(/euin/i), 'E123456789')
      await user.type(screen.getByLabelText(/first name/i), 'Rajesh')
      await user.type(screen.getByLabelText(/last name/i), 'Kumar')
      await user.type(screen.getByLabelText(/email/i), 'rajesh.kumar@example.com')
      await user.type(screen.getByLabelText(/mobile/i), '+919876543210')
      await user.type(screen.getByTestId('password-input'), 'SecurePass123!')
      await user.type(screen.getByTestId('confirm-password-input'), 'SecurePass123!')
      
      // Select business type
      await user.selectOptions(screen.getByLabelText(/business type/i), 'individual')
      
      // Accept terms
      await user.click(screen.getByTestId('terms-checkbox'))
      await user.click(screen.getByTestId('dpdp-checkbox'))
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /register/i }))

      await waitFor(() => {
        expect(validateEUIN).toHaveBeenCalledWith('E123456789')
        expect(mockOnSubmit).toHaveBeenCalledWith({
          euin: 'E123456789',
          firstName: 'Rajesh',
          lastName: 'Kumar',
          email: 'rajesh.kumar@example.com',
          mobile: '+919876543210',
          businessType: 'individual',
          termsAccepted: true,
          dpdpConsent: true,
        })
      })
    })
  })

  describe('TC-E01-001-02: Invalid EUIN rejection', () => {
    it.skip('should reject registration with invalid EUIN format', async () => {
      const user = userEvent.setup()
      ;(validateEUIN as jest.Mock).mockResolvedValue({ 
        isValid: false, 
        error: 'Invalid EUIN format' 
      })
      
      render(
        <AdvisorRegistrationForm 
          onSubmit={mockOnSubmit}
          onError={mockOnError}
        />
      )

      await user.type(screen.getByLabelText(/euin/i), 'INVALID123')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      
      // Try to submit
      const submitButton = screen.getByRole('button', { name: /register/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid euin format/i)).toBeInTheDocument()
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    it.skip('should validate EUIN against SEBI database', async () => {
      const user = userEvent.setup()
      ;(validateEUIN as jest.Mock).mockResolvedValue({ 
        isValid: false, 
        error: 'EUIN not found in SEBI database' 
      })
      
      render(
        <AdvisorRegistrationForm 
          onSubmit={mockOnSubmit}
          onError={mockOnError}
        />
      )

      await user.type(screen.getByLabelText(/euin/i), 'E999999999')
      
      // Trigger validation
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/euin not found in sebi database/i)).toBeInTheDocument()
      })
    })
  })

  describe('TC-E01-001-03: Duplicate registration prevention', () => {
    it.skip('should prevent duplicate registration with same EUIN', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockRejectedValue({
        code: 'DUPLICATE_EUIN',
        message: 'This EUIN is already registered',
      })
      
      render(
        <AdvisorRegistrationForm 
          onSubmit={mockOnSubmit}
          onError={mockOnError}
        />
      )

      // Fill valid data
      await user.type(screen.getByLabelText(/euin/i), 'E123456789')
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/last name/i), 'User')
      await user.type(screen.getByLabelText(/mobile/i), '+919876543210')
      await user.type(screen.getByTestId('password-input'), 'SecurePass123!')
      await user.type(screen.getByTestId('confirm-password-input'), 'SecurePass123!')
      await user.click(screen.getByTestId('terms-checkbox'))
      await user.click(screen.getByTestId('dpdp-checkbox'))
      
      await user.click(screen.getByRole('button', { name: /register/i }))

      await waitFor(() => {
        expect(screen.getByText(/this euin is already registered/i)).toBeInTheDocument()
        expect(mockOnError).toHaveBeenCalledWith(expect.objectContaining({
          code: 'DUPLICATE_EUIN',
        }))
      })
    })
  })

  describe('TC-E01-001-04: Email verification flow', () => {
    it.skip('should require valid email format', async () => {
      const user = userEvent.setup()
      
      render(
        <AdvisorRegistrationForm 
          onSubmit={mockOnSubmit}
          onError={mockOnError}
        />
      )

      await user.type(screen.getByLabelText(/email/i), 'invalid-email')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
    })

    it.skip('should send verification email after registration', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue({
        success: true,
        requiresEmailVerification: true,
      })
      
      render(
        <AdvisorRegistrationForm 
          onSubmit={mockOnSubmit}
          onError={mockOnError}
        />
      )

      // Fill all required fields
      await user.type(screen.getByLabelText(/euin/i), 'E123456789')
      await user.type(screen.getByLabelText(/email/i), 'new@example.com')
      await user.type(screen.getByLabelText(/first name/i), 'New')
      await user.type(screen.getByLabelText(/last name/i), 'User')
      await user.type(screen.getByLabelText(/mobile/i), '+919876543210')
      await user.type(screen.getByTestId('password-input'), 'SecurePass123!')
      await user.type(screen.getByTestId('confirm-password-input'), 'SecurePass123!')
      await user.click(screen.getByTestId('terms-checkbox'))
      await user.click(screen.getByTestId('dpdp-checkbox'))
      
      await user.click(screen.getByRole('button', { name: /register/i }))

      await waitFor(() => {
        expect(screen.getByText(/verification email sent/i)).toBeInTheDocument()
      })
    })
  })

  describe('TC-E01-001-05: Password validation edge cases', () => {
    it.skip('should enforce minimum password strength requirements', async () => {
      const user = userEvent.setup()
      
      render(
        <AdvisorRegistrationForm 
          onSubmit={mockOnSubmit}
          onError={mockOnError}
        />
      )

      // Test weak password
      await user.type(screen.getByTestId('password-input'), 'weak')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it.skip('should require special characters in password', async () => {
      const user = userEvent.setup()
      
      render(
        <AdvisorRegistrationForm 
          onSubmit={mockOnSubmit}
          onError={mockOnError}
        />
      )

      await user.type(screen.getByTestId('password-input'), 'NoSpecial123')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one special character/i)).toBeInTheDocument()
      })
    })

    it.skip('should validate password confirmation match', async () => {
      const user = userEvent.setup()
      
      render(
        <AdvisorRegistrationForm 
          onSubmit={mockOnSubmit}
          onError={mockOnError}
        />
      )

      await user.type(screen.getByTestId('password-input'), 'SecurePass123!')
      await user.type(screen.getByTestId('confirm-password-input'), 'DifferentPass123!')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })
  })

  describe('Mobile number validation', () => {
    it.skip('should validate Indian mobile number format', async () => {
      const user = userEvent.setup()
      
      render(
        <AdvisorRegistrationForm 
          onSubmit={mockOnSubmit}
          onError={mockOnError}
        />
      )

      // Test invalid Indian mobile number
      await user.type(screen.getByLabelText(/mobile/i), '+1234567890')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid indian mobile number/i)).toBeInTheDocument()
      })
    })

    it.skip('should accept valid Indian mobile numbers', async () => {
      const user = userEvent.setup()
      
      render(
        <AdvisorRegistrationForm 
          onSubmit={mockOnSubmit}
          onError={mockOnError}
        />
      )

      // Test valid formats
      const validNumbers = ['+919876543210', '9876543210', '09876543210']
      
      for (const number of validNumbers) {
        const input = screen.getByLabelText(/mobile/i)
        await user.clear(input)
        await user.type(input, number)
        await user.tab()
        
        await waitFor(() => {
          expect(screen.queryByText(/please enter a valid indian mobile number/i)).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('SEBI compliance validation', () => {
    it.skip('should validate advisor data against SEBI requirements', async () => {
      const user = userEvent.setup()
      const mockValidator = {
        validateAdvisorData: jest.fn().mockResolvedValue({ 
          isCompliant: false,
          violations: ['Missing required certification']
        }),
      }
      ;(SEBIComplianceValidator as jest.Mock).mockImplementation(() => mockValidator)
      
      render(
        <AdvisorRegistrationForm 
          onSubmit={mockOnSubmit}
          onError={mockOnError}
        />
      )

      // Fill form with data that fails SEBI compliance
      await user.type(screen.getByLabelText(/euin/i), 'E123456789')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/last name/i), 'User')
      await user.type(screen.getByLabelText(/mobile/i), '+919876543210')
      await user.type(screen.getByTestId('password-input'), 'SecurePass123!')
      await user.type(screen.getByTestId('confirm-password-input'), 'SecurePass123!')
      await user.click(screen.getByTestId('terms-checkbox'))
      await user.click(screen.getByTestId('dpdp-checkbox'))
      
      await user.click(screen.getByRole('button', { name: /register/i }))

      await waitFor(() => {
        expect(mockValidator.validateAdvisorData).toHaveBeenCalled()
        expect(screen.getByText(/missing required certification/i)).toBeInTheDocument()
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })
  })

  describe('Terms and conditions', () => {
    it.skip('should require acceptance of terms and conditions', async () => {
      const user = userEvent.setup()
      
      render(
        <AdvisorRegistrationForm 
          onSubmit={mockOnSubmit}
          onError={mockOnError}
        />
      )

      // Fill all fields except terms
      await user.type(screen.getByLabelText(/euin/i), 'E123456789')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/last name/i), 'User')
      await user.type(screen.getByLabelText(/mobile/i), '+919876543210')
      await user.type(screen.getByTestId('password-input'), 'SecurePass123!')
      await user.type(screen.getByTestId('confirm-password-input'), 'SecurePass123!')
      // Don't check terms checkbox
      
      await user.click(screen.getByRole('button', { name: /register/i }))

      await waitFor(() => {
        expect(screen.getByText(/you must accept the terms and conditions/i)).toBeInTheDocument()
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    it.skip('should require DPDP Act consent', async () => {
      const user = userEvent.setup()
      
      render(
        <AdvisorRegistrationForm 
          onSubmit={mockOnSubmit}
          onError={mockOnError}
        />
      )

      // Fill all fields except DPDP consent
      await user.type(screen.getByLabelText(/euin/i), 'E123456789')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/last name/i), 'User')
      await user.type(screen.getByLabelText(/mobile/i), '+919876543210')
      await user.type(screen.getByTestId('password-input'), 'SecurePass123!')
      await user.type(screen.getByTestId('confirm-password-input'), 'SecurePass123!')
      await user.click(screen.getByTestId('terms-checkbox'))
      // Don't check DPDP checkbox
      
      await user.click(screen.getByRole('button', { name: /register/i }))

      await waitFor(() => {
        expect(screen.getByText(/you must provide dpdp act consent/i)).toBeInTheDocument()
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })
  })

  describe('Mobile responsiveness', () => {
    it.skip('should render correctly on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 })
      Object.defineProperty(window, 'innerHeight', { writable: true, value: 667 })
      
      render(
        <AdvisorRegistrationForm 
          onSubmit={mockOnSubmit}
          onError={mockOnError}
        />
      )

      // Check if mobile-optimized layout is applied
      const form = screen.getByTestId('registration-form')
      expect(form).toHaveClass('mobile-optimized')
      
      // Verify all form fields are accessible on mobile
      expect(screen.getByLabelText(/euin/i)).toBeVisible()
      expect(screen.getByLabelText(/email/i)).toBeVisible()
      expect(screen.getByRole('button', { name: /register/i })).toBeVisible()
    })
  })
})