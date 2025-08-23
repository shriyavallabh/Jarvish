/**
 * Two-Factor Authentication Service
 * Implements TOTP-based 2FA for enhanced security
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/lib/redis';
import crypto from 'crypto';

interface TwoFactorSecret {
  advisorId: string;
  secret: string;
  backupCodes: string[];
  enabled: boolean;
  createdAt: Date;
}

interface VerificationResult {
  valid: boolean;
  remainingAttempts?: number;
  lockedUntil?: Date;
}

export class TwoFactorAuthService {
  private supabase: any;
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly BACKUP_CODE_COUNT = 10;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Generate 2FA secret for advisor
   */
  async generateSecret(advisorId: string, advisorEmail: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `Jarvish (${advisorEmail})`,
        issuer: 'Jarvish Financial Platform',
        length: 32
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Store secret temporarily (not enabled yet)
      await redis.setex(
        `2fa:setup:${advisorId}`,
        600, // 10 minutes to complete setup
        JSON.stringify({
          secret: secret.base32,
          backupCodes,
          timestamp: Date.now()
        })
      );

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes
      };

    } catch (error) {
      console.error('2FA secret generation failed:', error);
      throw new Error('Failed to generate 2FA secret');
    }
  }

  /**
   * Enable 2FA after verification
   */
  async enable2FA(
    advisorId: string,
    verificationCode: string
  ): Promise<{ success: boolean; backupCodes?: string[] }> {
    try {
      // Get temporary secret
      const setupData = await redis.get(`2fa:setup:${advisorId}`);
      if (!setupData) {
        throw new Error('2FA setup expired or not found');
      }

      const { secret, backupCodes } = JSON.parse(setupData);

      // Verify the code
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: verificationCode,
        window: 2
      });

      if (!verified) {
        return { success: false };
      }

      // Encrypt secret before storing
      const encryptedSecret = this.encryptSecret(secret);

      // Store in database
      const { error } = await this.supabase
        .from('two_factor_auth')
        .upsert({
          advisor_id: advisorId,
          secret: encryptedSecret,
          backup_codes: backupCodes.map(code => this.hashBackupCode(code)),
          enabled: true,
          enabled_at: new Date(),
          updated_at: new Date()
        });

      if (error) throw error;

      // Clear setup data
      await redis.del(`2fa:setup:${advisorId}`);

      // Clear any existing sessions to force re-authentication
      await this.invalidateExistingSessions(advisorId);

      // Log security event
      await this.logSecurityEvent(advisorId, '2FA_ENABLED');

      return {
        success: true,
        backupCodes
      };

    } catch (error) {
      console.error('2FA enablement failed:', error);
      throw new Error('Failed to enable 2FA');
    }
  }

  /**
   * Verify 2FA code
   */
  async verifyCode(
    advisorId: string,
    code: string
  ): Promise<VerificationResult> {
    try {
      // Check if account is locked
      const lockKey = `2fa:locked:${advisorId}`;
      const lockedUntil = await redis.get(lockKey);
      
      if (lockedUntil) {
        const lockExpiry = new Date(parseInt(lockedUntil));
        if (lockExpiry > new Date()) {
          return {
            valid: false,
            lockedUntil: lockExpiry
          };
        }
      }

      // Get 2FA configuration
      const { data: config } = await this.supabase
        .from('two_factor_auth')
        .select('secret, backup_codes')
        .eq('advisor_id', advisorId)
        .eq('enabled', true)
        .single();

      if (!config) {
        throw new Error('2FA not configured');
      }

      // Decrypt secret
      const secret = this.decryptSecret(config.secret);

      // Check if it's a backup code
      const isBackupCode = await this.verifyBackupCode(
        advisorId,
        code,
        config.backup_codes
      );

      if (isBackupCode) {
        await this.logSecurityEvent(advisorId, 'BACKUP_CODE_USED');
        return { valid: true };
      }

      // Verify TOTP code
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: code,
        window: 2 // Allow 2 time steps before/after
      });

      if (verified) {
        // Reset failed attempts
        await redis.del(`2fa:attempts:${advisorId}`);
        return { valid: true };
      }

      // Handle failed attempt
      const attempts = await this.incrementFailedAttempts(advisorId);
      
      if (attempts >= this.MAX_ATTEMPTS) {
        // Lock account
        const lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
        await redis.setex(
          lockKey,
          this.LOCKOUT_DURATION / 1000,
          lockedUntil.getTime().toString()
        );

        await this.logSecurityEvent(advisorId, '2FA_LOCKED');

        return {
          valid: false,
          remainingAttempts: 0,
          lockedUntil
        };
      }

      return {
        valid: false,
        remainingAttempts: this.MAX_ATTEMPTS - attempts
      };

    } catch (error) {
      console.error('2FA verification failed:', error);
      throw new Error('Failed to verify 2FA code');
    }
  }

  /**
   * Disable 2FA
   */
  async disable2FA(advisorId: string, password: string): Promise<boolean> {
    try {
      // Verify password first (implement password verification)
      const passwordValid = await this.verifyPassword(advisorId, password);
      if (!passwordValid) {
        throw new Error('Invalid password');
      }

      // Disable 2FA
      const { error } = await this.supabase
        .from('two_factor_auth')
        .update({
          enabled: false,
          disabled_at: new Date()
        })
        .eq('advisor_id', advisorId);

      if (error) throw error;

      // Clear any cached data
      await redis.del(`2fa:${advisorId}`);

      // Log security event
      await this.logSecurityEvent(advisorId, '2FA_DISABLED');

      return true;

    } catch (error) {
      console.error('2FA disable failed:', error);
      throw new Error('Failed to disable 2FA');
    }
  }

  /**
   * Generate recovery codes
   */
  async regenerateBackupCodes(
    advisorId: string,
    currentCode: string
  ): Promise<string[]> {
    try {
      // Verify current 2FA code first
      const verification = await this.verifyCode(advisorId, currentCode);
      if (!verification.valid) {
        throw new Error('Invalid 2FA code');
      }

      // Generate new backup codes
      const backupCodes = this.generateBackupCodes();

      // Update in database
      const { error } = await this.supabase
        .from('two_factor_auth')
        .update({
          backup_codes: backupCodes.map(code => this.hashBackupCode(code)),
          backup_codes_generated_at: new Date()
        })
        .eq('advisor_id', advisorId);

      if (error) throw error;

      // Log security event
      await this.logSecurityEvent(advisorId, 'BACKUP_CODES_REGENERATED');

      return backupCodes;

    } catch (error) {
      console.error('Backup code regeneration failed:', error);
      throw new Error('Failed to regenerate backup codes');
    }
  }

  /**
   * Check if 2FA is enabled for advisor
   */
  async is2FAEnabled(advisorId: string): Promise<boolean> {
    try {
      // Check cache first
      const cached = await redis.get(`2fa:enabled:${advisorId}`);
      if (cached !== null) {
        return cached === 'true';
      }

      // Check database
      const { data } = await this.supabase
        .from('two_factor_auth')
        .select('enabled')
        .eq('advisor_id', advisorId)
        .single();

      const enabled = data?.enabled || false;

      // Cache for 5 minutes
      await redis.setex(
        `2fa:enabled:${advisorId}`,
        300,
        enabled.toString()
      );

      return enabled;

    } catch (error) {
      console.error('2FA status check failed:', error);
      return false;
    }
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }

    return codes;
  }

  /**
   * Hash backup code for storage
   */
  private hashBackupCode(code: string): string {
    return crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');
  }

  /**
   * Verify backup code
   */
  private async verifyBackupCode(
    advisorId: string,
    code: string,
    hashedCodes: string[]
  ): Promise<boolean> {
    const hashedInput = this.hashBackupCode(code);
    
    if (hashedCodes.includes(hashedInput)) {
      // Remove used backup code
      const updatedCodes = hashedCodes.filter(c => c !== hashedInput);
      
      await this.supabase
        .from('two_factor_auth')
        .update({
          backup_codes: updatedCodes,
          last_backup_code_used: new Date()
        })
        .eq('advisor_id', advisorId);

      return true;
    }

    return false;
  }

  /**
   * Encrypt secret for storage
   */
  private encryptSecret(secret: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt secret
   */
  private decryptSecret(encryptedData: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Increment failed attempts
   */
  private async incrementFailedAttempts(advisorId: string): Promise<number> {
    const key = `2fa:attempts:${advisorId}`;
    const attempts = await redis.incr(key);
    
    if (attempts === 1) {
      // Set expiry on first attempt
      await redis.expire(key, 3600); // 1 hour
    }

    return attempts;
  }

  /**
   * Invalidate existing sessions
   */
  private async invalidateExistingSessions(advisorId: string) {
    // Implement session invalidation
    await redis.del(`session:${advisorId}:*`);
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(advisorId: string, event: string) {
    await this.supabase
      .from('security_events')
      .insert({
        advisor_id: advisorId,
        event_type: event,
        timestamp: new Date(),
        ip_address: '', // Get from request context
        user_agent: '' // Get from request context
      });
  }

  /**
   * Verify password (placeholder)
   */
  private async verifyPassword(advisorId: string, password: string): Promise<boolean> {
    // Implement password verification
    // This should check against the hashed password in the database
    return true; // Placeholder
  }

  /**
   * Get 2FA status and configuration
   */
  async get2FAStatus(advisorId: string): Promise<{
    enabled: boolean;
    backupCodesRemaining?: number;
    lastUsed?: Date;
  }> {
    try {
      const { data } = await this.supabase
        .from('two_factor_auth')
        .select('enabled, backup_codes, last_used')
        .eq('advisor_id', advisorId)
        .single();

      if (!data) {
        return { enabled: false };
      }

      return {
        enabled: data.enabled,
        backupCodesRemaining: data.backup_codes?.length || 0,
        lastUsed: data.last_used ? new Date(data.last_used) : undefined
      };

    } catch (error) {
      console.error('Failed to get 2FA status:', error);
      return { enabled: false };
    }
  }
}