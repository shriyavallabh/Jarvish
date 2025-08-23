/**
 * Two-Factor Authentication Service Unit Tests
 * Testing TOTP-based 2FA implementation
 */

import { TwoFactorAuthService } from '@/lib/services/two-factor-auth';
import { createClient } from '@supabase/supabase-js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { redis } from '@/lib/redis';
import crypto from 'crypto';

// Mock external dependencies
jest.mock('@supabase/supabase-js');
jest.mock('speakeasy');
jest.mock('qrcode');
jest.mock('@/lib/redis');
jest.mock('crypto');

describe('TwoFactorAuthService', () => {
  let twoFactorService: TwoFactorAuthService;
  let mockSupabase: any;
  let mockRedis: any;

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis()
    };

    // Mock Redis client
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn()
    };

    // Mock crypto
    (crypto.randomBytes as jest.Mock) = jest.fn()
      .mockReturnValue(Buffer.from('12345678', 'hex'));
    
    (crypto.createHash as jest.Mock) = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hashed_code')
    });

    (crypto.createCipheriv as jest.Mock) = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue('encrypted_part1'),
      final: jest.fn().mockReturnValue('_part2'),
      getAuthTag: jest.fn().mockReturnValue(Buffer.from('authtag', 'hex'))
    });

    (crypto.createDecipheriv as jest.Mock) = jest.fn().mockReturnValue({
      setAuthTag: jest.fn(),
      update: jest.fn().mockReturnValue('decrypted_'),
      final: jest.fn().mockReturnValue('secret')
    });

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    (redis.get as jest.Mock) = mockRedis.get;
    (redis.set as jest.Mock) = mockRedis.set;
    (redis.setex as jest.Mock) = mockRedis.setex;
    (redis.del as jest.Mock) = mockRedis.del;
    (redis.incr as jest.Mock) = mockRedis.incr;
    (redis.expire as jest.Mock) = mockRedis.expire;

    // Create service instance
    twoFactorService = new TwoFactorAuthService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSecret', () => {
    it('should generate 2FA secret with QR code', async () => {
      const advisorId = 'advisor_123';
      const advisorEmail = 'advisor@example.com';

      // Mock speakeasy secret generation
      (speakeasy.generateSecret as jest.Mock).mockReturnValue({
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url: 'otpauth://totp/Jarvish:advisor@example.com?secret=JBSWY3DPEHPK3PXP'
      });

      // Mock QR code generation
      (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,qrcode');

      const result = await twoFactorService.generateSecret(advisorId, advisorEmail);

      expect(result).toEqual({
        secret: 'JBSWY3DPEHPK3PXP',
        qrCodeUrl: 'data:image/png;base64,qrcode',
        backupCodes: expect.arrayContaining([
          expect.stringMatching(/^[A-F0-9]{4}-[A-F0-9]{4}$/)
        ])
      });

      expect(result.backupCodes).toHaveLength(10);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `2fa:setup:${advisorId}`,
        600,
        expect.any(String)
      );
    });

    it('should handle QR code generation failure', async () => {
      (speakeasy.generateSecret as jest.Mock).mockReturnValue({
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url: 'otpauth://totp/test'
      });

      (QRCode.toDataURL as jest.Mock).mockRejectedValue(new Error('QR generation failed'));

      await expect(
        twoFactorService.generateSecret('advisor_123', 'test@example.com')
      ).rejects.toThrow('Failed to generate 2FA secret');
    });
  });

  describe('enable2FA', () => {
    it('should enable 2FA with valid verification code', async () => {
      const advisorId = 'advisor_123';
      const verificationCode = '123456';

      // Mock setup data retrieval
      mockRedis.get.mockResolvedValue(JSON.stringify({
        secret: 'JBSWY3DPEHPK3PXP',
        backupCodes: ['1234-5678', '9876-5432'],
        timestamp: Date.now()
      }));

      // Mock TOTP verification
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      // Mock database operations
      mockSupabase.upsert.mockResolvedValue({
        error: null
      });

      const result = await twoFactorService.enable2FA(advisorId, verificationCode);

      expect(result).toEqual({
        success: true,
        backupCodes: ['1234-5678', '9876-5432']
      });

      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'JBSWY3DPEHPK3PXP',
        encoding: 'base32',
        token: verificationCode,
        window: 2
      });

      expect(mockSupabase.upsert).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalledWith(`2fa:setup:${advisorId}`);
    });

    it('should reject invalid verification code', async () => {
      const advisorId = 'advisor_123';

      mockRedis.get.mockResolvedValue(JSON.stringify({
        secret: 'JBSWY3DPEHPK3PXP',
        backupCodes: ['1234-5678']
      }));

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      const result = await twoFactorService.enable2FA(advisorId, 'wrong_code');

      expect(result).toEqual({
        success: false
      });

      expect(mockSupabase.upsert).not.toHaveBeenCalled();
    });

    it('should handle expired setup', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(
        twoFactorService.enable2FA('advisor_123', '123456')
      ).rejects.toThrow('2FA setup expired or not found');
    });
  });

  describe('verifyCode', () => {
    it('should verify valid TOTP code', async () => {
      const advisorId = 'advisor_123';
      const code = '123456';

      // No lockout
      mockRedis.get.mockResolvedValueOnce(null);

      // Mock 2FA config retrieval
      mockSupabase.single.mockResolvedValue({
        data: {
          secret: 'encrypted_secret',
          backup_codes: ['hashed_code1', 'hashed_code2']
        }
      });

      // Mock TOTP verification
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      const result = await twoFactorService.verifyCode(advisorId, code);

      expect(result).toEqual({
        valid: true
      });

      expect(mockRedis.del).toHaveBeenCalledWith(`2fa:attempts:${advisorId}`);
    });

    it('should verify valid backup code', async () => {
      const advisorId = 'advisor_123';
      const backupCode = '1234-5678';

      mockRedis.get.mockResolvedValueOnce(null);

      mockSupabase.single.mockResolvedValue({
        data: {
          secret: 'encrypted_secret',
          backup_codes: ['hashed_code1', 'hashed_code']
        }
      });

      // Mock backup code hash matching
      (crypto.createHash as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed_code')
      });

      // Mock TOTP verification failure (to test backup code path)
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      // Mock backup code update
      mockSupabase.update.mockResolvedValue({ error: null });

      const result = await twoFactorService.verifyCode(advisorId, backupCode);

      expect(result).toEqual({
        valid: true
      });

      expect(mockSupabase.insert).toHaveBeenCalled(); // Security event logged
    });

    it('should handle invalid code with remaining attempts', async () => {
      const advisorId = 'advisor_123';

      mockRedis.get.mockResolvedValueOnce(null); // No lockout

      mockSupabase.single.mockResolvedValue({
        data: {
          secret: 'encrypted_secret',
          backup_codes: []
        }
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);
      
      // Mock failed attempts
      mockRedis.incr.mockResolvedValue(2);
      mockRedis.expire.mockResolvedValue(true);

      const result = await twoFactorService.verifyCode(advisorId, 'wrong_code');

      expect(result).toEqual({
        valid: false,
        remainingAttempts: 3 // MAX_ATTEMPTS (5) - 2
      });
    });

    it('should lock account after max attempts', async () => {
      const advisorId = 'advisor_123';

      mockRedis.get.mockResolvedValueOnce(null); // No existing lockout

      mockSupabase.single.mockResolvedValue({
        data: {
          secret: 'encrypted_secret',
          backup_codes: []
        }
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);
      
      // Max attempts reached
      mockRedis.incr.mockResolvedValue(5);

      const result = await twoFactorService.verifyCode(advisorId, 'wrong_code');

      expect(result.valid).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.lockedUntil).toBeInstanceOf(Date);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        `2fa:locked:${advisorId}`,
        1800, // 30 minutes
        expect.any(String)
      );
    });

    it('should reject verification when account is locked', async () => {
      const advisorId = 'advisor_123';
      const futureTime = Date.now() + 10 * 60 * 1000; // 10 minutes from now

      mockRedis.get.mockResolvedValueOnce(futureTime.toString());

      const result = await twoFactorService.verifyCode(advisorId, '123456');

      expect(result.valid).toBe(false);
      expect(result.lockedUntil).toBeInstanceOf(Date);
      expect(result.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('disable2FA', () => {
    it('should disable 2FA with valid password', async () => {
      const advisorId = 'advisor_123';
      const password = 'SecurePass123';

      // Mock password verification (placeholder returns true)
      mockSupabase.update.mockResolvedValue({ error: null });

      const result = await twoFactorService.disable2FA(advisorId, password);

      expect(result).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        enabled: false,
        disabled_at: expect.any(Date)
      });
      expect(mockRedis.del).toHaveBeenCalledWith(`2fa:${advisorId}`);
    });

    it('should handle database error during disable', async () => {
      mockSupabase.update.mockResolvedValue({
        error: new Error('Database error')
      });

      await expect(
        twoFactorService.disable2FA('advisor_123', 'password')
      ).rejects.toThrow('Failed to disable 2FA');
    });
  });

  describe('regenerateBackupCodes', () => {
    it('should regenerate backup codes with valid 2FA code', async () => {
      const advisorId = 'advisor_123';
      const currentCode = '123456';

      // Mock successful code verification
      jest.spyOn(twoFactorService, 'verifyCode').mockResolvedValue({
        valid: true
      });

      // Mock backup code generation
      (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from('abcdef12', 'hex'));

      mockSupabase.update.mockResolvedValue({ error: null });

      const result = await twoFactorService.regenerateBackupCodes(advisorId, currentCode);

      expect(result).toHaveLength(10);
      expect(result[0]).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
      
      expect(mockSupabase.update).toHaveBeenCalledWith({
        backup_codes: expect.any(Array),
        backup_codes_generated_at: expect.any(Date)
      });
    });

    it('should reject regeneration with invalid code', async () => {
      jest.spyOn(twoFactorService, 'verifyCode').mockResolvedValue({
        valid: false,
        remainingAttempts: 3
      });

      await expect(
        twoFactorService.regenerateBackupCodes('advisor_123', 'wrong_code')
      ).rejects.toThrow('Invalid 2FA code');
    });
  });

  describe('is2FAEnabled', () => {
    it('should return cached 2FA status', async () => {
      const advisorId = 'advisor_123';

      mockRedis.get.mockResolvedValue('true');

      const result = await twoFactorService.is2FAEnabled(advisorId);

      expect(result).toBe(true);
      expect(mockSupabase.select).not.toHaveBeenCalled();
    });

    it('should check database when cache miss', async () => {
      const advisorId = 'advisor_123';

      mockRedis.get.mockResolvedValue(null);
      mockSupabase.single.mockResolvedValue({
        data: { enabled: true }
      });

      const result = await twoFactorService.is2FAEnabled(advisorId);

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `2fa:enabled:${advisorId}`,
        300,
        'true'
      );
    });

    it('should return false when 2FA not configured', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockSupabase.single.mockResolvedValue({
        data: null
      });

      const result = await twoFactorService.is2FAEnabled('advisor_123');

      expect(result).toBe(false);
    });
  });

  describe('get2FAStatus', () => {
    it('should return complete 2FA status', async () => {
      const advisorId = 'advisor_123';

      mockSupabase.single.mockResolvedValue({
        data: {
          enabled: true,
          backup_codes: ['code1', 'code2', 'code3'],
          last_used: '2024-01-15T10:00:00Z'
        }
      });

      const result = await twoFactorService.get2FAStatus(advisorId);

      expect(result).toEqual({
        enabled: true,
        backupCodesRemaining: 3,
        lastUsed: new Date('2024-01-15T10:00:00Z')
      });
    });

    it('should handle no 2FA configuration', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null
      });

      const result = await twoFactorService.get2FAStatus('advisor_123');

      expect(result).toEqual({
        enabled: false
      });
    });
  });

  describe('Security Features', () => {
    it('should encrypt secrets before storage', async () => {
      const advisorId = 'advisor_123';
      const verificationCode = '123456';

      mockRedis.get.mockResolvedValue(JSON.stringify({
        secret: 'JBSWY3DPEHPK3PXP',
        backupCodes: ['1234-5678']
      }));

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      mockSupabase.upsert.mockResolvedValue({ error: null });

      await twoFactorService.enable2FA(advisorId, verificationCode);

      // Verify encryption was called
      expect(crypto.createCipheriv).toHaveBeenCalledWith(
        'aes-256-gcm',
        expect.any(Buffer),
        expect.any(Buffer)
      );

      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          secret: expect.stringContaining(':') // Encrypted format
        })
      );
    });

    it('should invalidate sessions on 2FA enable', async () => {
      const advisorId = 'advisor_123';

      mockRedis.get.mockResolvedValue(JSON.stringify({
        secret: 'secret',
        backupCodes: []
      }));

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      mockSupabase.upsert.mockResolvedValue({ error: null });

      await twoFactorService.enable2FA(advisorId, '123456');

      expect(mockRedis.del).toHaveBeenCalledWith(`session:${advisorId}:*`);
    });

    it('should log security events', async () => {
      const advisorId = 'advisor_123';

      mockRedis.get.mockResolvedValue(JSON.stringify({
        secret: 'secret',
        backupCodes: []
      }));

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      mockSupabase.upsert.mockResolvedValue({ error: null });
      mockSupabase.insert.mockResolvedValue({ error: null });

      await twoFactorService.enable2FA(advisorId, '123456');

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          advisor_id: advisorId,
          event_type: '2FA_ENABLED',
          timestamp: expect.any(Date)
        })
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should track failed attempts', async () => {
      const advisorId = 'advisor_123';

      mockRedis.get.mockResolvedValueOnce(null); // No lockout
      mockSupabase.single.mockResolvedValue({
        data: {
          secret: 'encrypted_secret',
          backup_codes: []
        }
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);
      mockRedis.incr.mockResolvedValue(1);

      await twoFactorService.verifyCode(advisorId, 'wrong_code');

      expect(mockRedis.incr).toHaveBeenCalledWith(`2fa:attempts:${advisorId}`);
      expect(mockRedis.expire).toHaveBeenCalledWith(`2fa:attempts:${advisorId}`, 3600);
    });

    it('should reset attempts on successful verification', async () => {
      const advisorId = 'advisor_123';

      mockRedis.get.mockResolvedValueOnce(null);
      mockSupabase.single.mockResolvedValue({
        data: {
          secret: 'encrypted_secret',
          backup_codes: []
        }
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      await twoFactorService.verifyCode(advisorId, '123456');

      expect(mockRedis.del).toHaveBeenCalledWith(`2fa:attempts:${advisorId}`);
    });
  });
});