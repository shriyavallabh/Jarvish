'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { validateEUIN } from '@/lib/validators/euin'
import { SEBIComplianceValidator } from '@/lib/validators/sebi-compliance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert } from '@/components/ui/alert'

// Form validation schema
const registrationSchema = z.object({
  euin: z.string().regex(/^E\d{9}$/, 'Invalid EUIN format'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  mobile: z.string().regex(/^(\+91)?[6-9]\d{9}$/, 'Please enter a valid Indian mobile number'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  businessType: z.enum(['individual', 'partnership', 'company', 'llp']),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
  dpdpConsent: z.boolean().refine(val => val === true, {
    message: 'You must provide DPDP Act consent',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type RegistrationFormData = z.infer<typeof registrationSchema>

interface AdvisorRegistrationFormProps {
  onSubmit: (data: any) => Promise<any>
  onError?: (error: any) => void
}

export function AdvisorRegistrationForm({ onSubmit, onError }: AdvisorRegistrationFormProps) {
  const [isValidatingEUIN, setIsValidatingEUIN] = useState(false)
  const [euinValidationResult, setEuinValidationResult] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    clearErrors,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  })

  const euinValue = watch('euin')

  // Check if mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Validate EUIN when it changes
  useEffect(() => {
    const validateEUINAsync = async () => {
      if (euinValue && euinValue.match(/^E\d{9}$/)) {
        setIsValidatingEUIN(true)
        try {
          const result = await validateEUIN(euinValue)
          setEuinValidationResult(result)
          
          if (!result.isValid) {
            setError('euin', { message: result.error })
          } else {
            clearErrors('euin')
          }
        } catch (error) {
          setError('euin', { message: 'Failed to validate EUIN' })
        } finally {
          setIsValidatingEUIN(false)
        }
      }
    }

    const debounceTimer = setTimeout(validateEUINAsync, 500)
    return () => clearTimeout(debounceTimer)
  }, [euinValue, setError, clearErrors])

  const onFormSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitMessage(null)

    try {
      // Validate with SEBI compliance
      const validator = new SEBIComplianceValidator()
      const complianceResult = await validator.validateCompleteRegistration(data)
      
      if (!complianceResult.isCompliant) {
        const firstViolation = complianceResult.violations?.[0] || 'Compliance validation failed'
        setSubmitError(firstViolation)
        
        // Set specific field errors
        complianceResult.violations?.forEach(violation => {
          if (violation.includes('NISM certification')) {
            setError('euin', { message: violation })
          }
        })
        
        if (onError) {
          onError({ code: 'COMPLIANCE_ERROR', violations: complianceResult.violations })
        }
        return
      }

      // Submit the form
      const result = await onSubmit({
        euin: data.euin,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        mobile: data.mobile,
        businessType: data.businessType,
        termsAccepted: data.termsAccepted,
        dpdpConsent: data.dpdpConsent,
      })

      if (result.success) {
        if (result.requiresEmailVerification) {
          setSubmitMessage('Registration successful! Verification email sent to your email address.')
        } else {
          setSubmitMessage('Registration successful!')
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed'
      setSubmitError(errorMessage)
      
      if (error.code === 'DUPLICATE_EUIN') {
        setError('euin', { message: 'This EUIN is already registered' })
      }
      
      if (onError) {
        onError(error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      data-testid="registration-form"
      className={`space-y-6 ${isMobile ? 'mobile-optimized px-4' : 'max-w-2xl mx-auto'}`}
      onSubmit={handleSubmit(onFormSubmit)}
      role="form"
    >
      {/* EUIN Field */}
      <div className="space-y-2">
        <Label htmlFor="euin">EUIN (Employee Unique Identification Number)</Label>
        <Input
          id="euin"
          data-testid="euin-input"
          {...register('euin')}
          placeholder="E123456789"
          aria-label="EUIN"
          aria-describedby={errors.euin ? 'euin-error' : undefined}
          className={isMobile ? 'h-11' : ''}
        />
        {isValidatingEUIN && (
          <span className="text-sm text-gray-500">Validating EUIN...</span>
        )}
        {euinValidationResult?.isValid && (
          <span data-testid="euin-validation-success" className="text-sm text-green-600">
            ✓ EUIN validated successfully
          </span>
        )}
        {errors.euin && (
          <span 
            id="euin-error"
            data-testid="euin-error" 
            className="text-sm text-red-600"
            aria-live="polite"
          >
            {errors.euin.message}
          </span>
        )}
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            data-testid="first-name-input"
            {...register('firstName')}
            aria-label="First Name"
            className={isMobile ? 'h-11' : ''}
          />
          {errors.firstName && (
            <span className="text-sm text-red-600">{errors.firstName.message}</span>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            data-testid="last-name-input"
            {...register('lastName')}
            aria-label="Last Name"
            className={isMobile ? 'h-11' : ''}
          />
          {errors.lastName && (
            <span className="text-sm text-red-600">{errors.lastName.message}</span>
          )}
        </div>
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          data-testid="email-input"
          {...register('email')}
          aria-label="Email"
          className={isMobile ? 'h-11' : ''}
        />
        {errors.email && (
          <span className="text-sm text-red-600">{errors.email.message}</span>
        )}
      </div>

      {/* Mobile Field */}
      <div className="space-y-2">
        <Label htmlFor="mobile">Mobile Number</Label>
        <Input
          id="mobile"
          data-testid="mobile-input"
          {...register('mobile')}
          placeholder="+919876543210"
          aria-label="Mobile"
          aria-describedby={errors.mobile ? 'mobile-error' : undefined}
          className={isMobile ? 'h-11' : ''}
        />
        {errors.mobile && (
          <span 
            id="mobile-error"
            data-testid="mobile-error" 
            className="text-sm text-red-600"
            aria-live="polite"
          >
            {errors.mobile.message}
          </span>
        )}
      </div>

      {/* Password Fields */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          data-testid="password-input"
          {...register('password')}
          aria-label="Password"
          aria-describedby={errors.password ? 'password-error' : undefined}
          className={isMobile ? 'h-11' : ''}
        />
        {errors.password && (
          <span 
            id="password-error"
            data-testid="password-error" 
            className="text-sm text-red-600"
          >
            {errors.password.message}
          </span>
        )}
        {watch('password') && watch('password').length < 8 && (
          <span data-testid="password-strength-weak" className="text-sm text-orange-600">
            Weak password
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          data-testid="confirm-password-input"
          {...register('confirmPassword')}
          aria-label="Confirm Password"
          className={isMobile ? 'h-11' : ''}
        />
        {errors.confirmPassword && (
          <span className="text-sm text-red-600">{errors.confirmPassword.message}</span>
        )}
      </div>

      {/* Business Type */}
      <div className="space-y-2">
        <Label htmlFor="businessType">Business Type</Label>
        <select
          id="businessType"
          data-testid="business-type-select"
          {...register('businessType')}
          aria-label="Business Type"
          className={`w-full px-3 py-2 border rounded-md ${isMobile ? 'h-11' : ''}`}
        >
          <option value="">Select business type</option>
          <option value="individual">Individual Advisor</option>
          <option value="partnership">Partnership Firm</option>
          <option value="company">Company</option>
          <option value="llp">Limited Liability Partnership</option>
        </select>
        {errors.businessType && (
          <span className="text-sm text-red-600">{errors.businessType.message}</span>
        )}
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-4">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms"
            data-testid="terms-checkbox"
            {...register('termsAccepted')}
            aria-label="Terms and Conditions"
          />
          <Label htmlFor="terms" className="text-sm">
            I accept the Terms and Conditions and Privacy Policy
          </Label>
        </div>
        {errors.termsAccepted && (
          <span 
            data-testid="terms-error" 
            className="text-sm text-red-600"
          >
            {errors.termsAccepted.message}
          </span>
        )}

        <div className="flex items-start space-x-2">
          <Checkbox
            id="dpdp"
            data-testid="dpdp-checkbox"
            {...register('dpdpConsent')}
            aria-label="DPDP Act Consent"
          />
          <Label htmlFor="dpdp" className="text-sm">
            I provide consent under the Digital Personal Data Protection Act
          </Label>
        </div>
        {errors.dpdpConsent && (
          <span className="text-sm text-red-600">{errors.dpdpConsent.message}</span>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        data-testid="register-button"
        disabled={isSubmitting || Object.keys(errors).length > 0}
        className={`w-full ${isMobile ? 'h-11' : ''}`}
        aria-label="Register"
      >
        {isSubmitting ? 'Registering...' : 'Register'}
      </Button>

      {/* Success/Error Messages */}
      {submitMessage && (
        <Alert 
          data-testid="registration-success"
          className="bg-green-50 text-green-800"
        >
          <span data-testid="success-message">{submitMessage}</span>
        </Alert>
      )}
      
      {submitError && (
        <Alert 
          data-testid="registration-error"
          className="bg-red-50 text-red-800"
        >
          {submitError}
        </Alert>
      )}
    </form>
  )
}