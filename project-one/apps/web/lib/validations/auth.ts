import { z } from 'zod';

// Phone number validation (Indian format)
export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
  .transform((val) => val.replace(/\s/g, ''));

// OTP validation
export const otpSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only numbers');

// Login form validation
export const loginSchema = z.object({
  phone: phoneSchema,
});

// OTP verification form validation
export const otpVerificationSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

// Profile update validation
export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  firmName: z.string().min(2, 'Firm name must be at least 2 characters').optional(),
  licenseNumber: z.string().optional(),
  location: z.string().min(2, 'Location must be at least 2 characters').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  specializations: z.array(z.string()).optional(),
});

// Password validation (for future use)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number and special character'
  );