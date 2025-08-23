/**
 * Validation Utilities Tests
 */

import {
  validateEmail,
  validatePhoneNumber,
  validateEUIN,
  validatePAN,
  validateGST,
  validatePassword,
  validateURL,
  sanitizeInput,
  validateBusinessName,
  validateContentLength
} from '@/lib/utils/validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.in',
        'first_last@company.org',
        'user+tag@example.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@exam ple.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate Indian phone numbers', () => {
      const validNumbers = [
        '9876543210',
        '+919876543210',
        '919876543210',
        '+91-9876543210',
        '+91 9876543210'
      ];

      validNumbers.forEach(number => {
        expect(validatePhoneNumber(number)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidNumbers = [
        '123456789', // Too short
        '12345678901', // Too long
        '5234567890', // Doesn't start with 6-9
        'abcdefghij',
        ''
      ];

      invalidNumbers.forEach(number => {
        expect(validatePhoneNumber(number)).toBe(false);
      });
    });
  });

  describe('validateEUIN', () => {
    it('should validate correct EUIN format', () => {
      const validEUINs = [
        'E123456',
        'E000001',
        'E999999'
      ];

      validEUINs.forEach(euin => {
        expect(validateEUIN(euin)).toBe(true);
      });
    });

    it('should reject invalid EUIN format', () => {
      const invalidEUINs = [
        'A123456', // Wrong prefix
        'E12345', // Too short
        'E1234567', // Too long
        '123456', // No prefix
        'EABCDEF', // Non-numeric
        ''
      ];

      invalidEUINs.forEach(euin => {
        expect(validateEUIN(euin)).toBe(false);
      });
    });
  });

  describe('validatePAN', () => {
    it('should validate correct PAN format', () => {
      const validPANs = [
        'ABCDE1234F',
        'ZZZZZ9999Z'
      ];

      validPANs.forEach(pan => {
        expect(validatePAN(pan)).toBe(true);
      });
    });

    it('should reject invalid PAN format', () => {
      const invalidPANs = [
        'ABCD1234F', // Too short
        'ABCDEF1234F', // Too long
        'ABCDE12345', // Last char not letter
        '1BCDE1234F', // First char not letter
        ''
      ];

      invalidPANs.forEach(pan => {
        expect(validatePAN(pan)).toBe(false);
      });
    });
  });

  describe('validateGST', () => {
    it('should validate correct GST format', () => {
      const validGSTs = [
        '27AAPFU0939F1ZV',
        '09AAACI1195H1Z0'
      ];

      validGSTs.forEach(gst => {
        expect(validateGST(gst)).toBe(true);
      });
    });

    it('should reject invalid GST format', () => {
      const invalidGSTs = [
        '27AAPFU0939F1Z', // Too short
        '27AAPFU0939F1ZVX', // Too long
        '99AAPFU0939F1ZV', // Invalid state code
        ''
      ];

      invalidGSTs.forEach(gst => {
        expect(validateGST(gst)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'StrongP@ss123',
        'Complex!Pass456',
        'MyP@ssw0rd!',
        'Secure#Pass789'
      ];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        { password: 'short', error: 'At least 8 characters' },
        { password: 'nouppercase123!', error: 'uppercase letter' },
        { password: 'NOLOWERCASE123!', error: 'lowercase letter' },
        { password: 'NoNumbers!', error: 'number' },
        { password: 'NoSpecialChar123', error: 'special character' }
      ];

      weakPasswords.forEach(({ password, error }) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes(error))).toBe(true);
      });
    });
  });

  describe('validateURL', () => {
    it('should validate correct URLs', () => {
      const validURLs = [
        'https://example.com',
        'http://subdomain.example.co.in',
        'https://example.com/path/to/page',
        'https://example.com?query=param',
        'https://example.com:8080'
      ];

      validURLs.forEach(url => {
        expect(validateURL(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidURLs = [
        'not a url',
        'ftp://example.com', // Not http/https
        'http:/example.com', // Missing slash
        'example.com', // No protocol
        ''
      ];

      invalidURLs.forEach(url => {
        expect(validateURL(url)).toBe(false);
      });
    });
  });

  describe('sanitizeInput', () => {
    it('should remove harmful characters', () => {
      const inputs = [
        { input: '<script>alert("xss")</script>', expected: 'alert("xss")' },
        { input: 'Normal text', expected: 'Normal text' },
        { input: '  Trimmed  ', expected: 'Trimmed' },
        { input: 'Line\nBreaks\rRemoved', expected: 'LineBreaksRemoved' }
      ];

      inputs.forEach(({ input, expected }) => {
        expect(sanitizeInput(input)).toBe(expected);
      });
    });

    it('should handle empty and null inputs', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });
  });

  describe('validateBusinessName', () => {
    it('should validate correct business names', () => {
      const validNames = [
        'ABC Financial Services',
        'XYZ Wealth Advisors Pvt. Ltd.',
        'John & Associates',
        '123 Investments'
      ];

      validNames.forEach(name => {
        expect(validateBusinessName(name)).toBe(true);
      });
    });

    it('should reject invalid business names', () => {
      const invalidNames = [
        'AB', // Too short
        'A'.repeat(101), // Too long
        '', // Empty
        '   ' // Only spaces
      ];

      invalidNames.forEach(name => {
        expect(validateBusinessName(name)).toBe(false);
      });
    });
  });

  describe('validateContentLength', () => {
    it('should validate content within limits', () => {
      const validContent = [
        { content: 'Short message', type: 'whatsapp', expected: true },
        { content: 'A'.repeat(280), type: 'twitter', expected: true },
        { content: 'A'.repeat(2000), type: 'linkedin', expected: true }
      ];

      validContent.forEach(({ content, type, expected }) => {
        expect(validateContentLength(content, type as any)).toBe(expected);
      });
    });

    it('should reject content exceeding limits', () => {
      const invalidContent = [
        { content: 'A'.repeat(1025), type: 'whatsapp' },
        { content: 'A'.repeat(281), type: 'twitter' },
        { content: 'A'.repeat(3001), type: 'linkedin' }
      ];

      invalidContent.forEach(({ content, type }) => {
        expect(validateContentLength(content, type as any)).toBe(false);
      });
    });

    it('should handle unknown content types', () => {
      expect(validateContentLength('Any content', 'unknown' as any)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in inputs', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      expect(sanitizeInput(specialChars)).toBeTruthy();
    });

    it('should handle unicode characters', () => {
      const unicode = 'हिंदी मराठी 中文 😊';
      expect(sanitizeInput(unicode)).toBeTruthy();
      expect(validateBusinessName('हिंदी वित्तीय सेवाएं')).toBe(true);
    });

    it('should be case insensitive for certain validations', () => {
      expect(validateEUIN('e123456')).toBe(false); // EUIN must be uppercase
      expect(validatePAN('abcde1234f')).toBe(false); // PAN must be uppercase
      expect(validateEmail('TEST@EXAMPLE.COM')).toBe(true); // Email case insensitive
    });
  });
});