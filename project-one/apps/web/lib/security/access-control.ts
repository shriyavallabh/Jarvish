/**
 * Access Control & Authentication
 * Role-based access control, multi-factor authentication, and session management
 */

import { z } from 'zod';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// User roles hierarchy
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  COMPLIANCE_OFFICER = 'compliance_officer',
  FINANCIAL_ADVISOR = 'financial_advisor',
  CONTENT_CREATOR = 'content_creator',
  SUPPORT_AGENT = 'support_agent',
  CLIENT = 'client',
  GUEST = 'guest',
}

// Permission types
export enum Permission {
  // User management
  USER_CREATE = 'user.create',
  USER_READ = 'user.read',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  
  // Content management
  CONTENT_CREATE = 'content.create',
  CONTENT_READ = 'content.read',
  CONTENT_UPDATE = 'content.update',
  CONTENT_DELETE = 'content.delete',
  CONTENT_APPROVE = 'content.approve',
  
  // Financial data
  FINANCIAL_READ = 'financial.read',
  FINANCIAL_WRITE = 'financial.write',
  FINANCIAL_APPROVE = 'financial.approve',
  
  // System administration
  SYSTEM_CONFIG = 'system.config',
  SYSTEM_MONITOR = 'system.monitor',
  SYSTEM_BACKUP = 'system.backup',
  
  // Compliance
  COMPLIANCE_VIEW = 'compliance.view',
  COMPLIANCE_AUDIT = 'compliance.audit',
  COMPLIANCE_REPORT = 'compliance.report',
  
  // API access
  API_FULL_ACCESS = 'api.full_access',
  API_LIMITED_ACCESS = 'api.limited_access',
}

// Role-Permission mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  
  [UserRole.ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_READ,
    Permission.CONTENT_UPDATE,
    Permission.CONTENT_DELETE,
    Permission.CONTENT_APPROVE,
    Permission.FINANCIAL_READ,
    Permission.SYSTEM_MONITOR,
    Permission.COMPLIANCE_VIEW,
    Permission.API_FULL_ACCESS,
  ],
  
  [UserRole.COMPLIANCE_OFFICER]: [
    Permission.USER_READ,
    Permission.CONTENT_READ,
    Permission.FINANCIAL_READ,
    Permission.COMPLIANCE_VIEW,
    Permission.COMPLIANCE_AUDIT,
    Permission.COMPLIANCE_REPORT,
    Permission.API_LIMITED_ACCESS,
  ],
  
  [UserRole.FINANCIAL_ADVISOR]: [
    Permission.USER_READ,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_READ,
    Permission.CONTENT_UPDATE,
    Permission.FINANCIAL_READ,
    Permission.FINANCIAL_WRITE,
    Permission.API_LIMITED_ACCESS,
  ],
  
  [UserRole.CONTENT_CREATOR]: [
    Permission.CONTENT_CREATE,
    Permission.CONTENT_READ,
    Permission.CONTENT_UPDATE,
    Permission.API_LIMITED_ACCESS,
  ],
  
  [UserRole.SUPPORT_AGENT]: [
    Permission.USER_READ,
    Permission.CONTENT_READ,
    Permission.API_LIMITED_ACCESS,
  ],
  
  [UserRole.CLIENT]: [
    Permission.CONTENT_READ,
    Permission.FINANCIAL_READ,
    Permission.API_LIMITED_ACCESS,
  ],
  
  [UserRole.GUEST]: [
    Permission.CONTENT_READ,
  ],
};

// Session schema
const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  token: z.string(),
  refreshToken: z.string(),
  ipAddress: z.string(),
  userAgent: z.string(),
  deviceId: z.string().optional(),
  mfaVerified: z.boolean().default(false),
  createdAt: z.date(),
  expiresAt: z.date(),
  lastActivity: z.date(),
  isActive: z.boolean().default(true),
});

export type Session = z.infer<typeof SessionSchema>;

// MFA configuration schema
const MFAConfigSchema = z.object({
  userId: z.string(),
  secret: z.string(),
  backupCodes: z.array(z.string()),
  enabled: z.boolean(),
  method: z.enum(['totp', 'sms', 'email', 'biometric']),
  verifiedAt: z.date().optional(),
});

export type MFAConfig = z.infer<typeof MFAConfigSchema>;

// API key schema
const APIKeySchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  userId: z.string(),
  permissions: z.array(z.nativeEnum(Permission)),
  rateLimit: z.number(),
  expiresAt: z.date().optional(),
  lastUsedAt: z.date().optional(),
  createdAt: z.date(),
  isActive: z.boolean().default(true),
});

export type APIKey = z.infer<typeof APIKeySchema>;

export class AccessControlManager {
  private jwtSecret: string;
  private sessionStore: Map<string, Session> = new Map();
  private mfaStore: Map<string, MFAConfig> = new Map();
  private apiKeyStore: Map<string, APIKey> = new Map();

  constructor(jwtSecret?: string) {
    this.jwtSecret = jwtSecret || process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
  }

  /**
   * Check if user has permission
   */
  hasPermission(userRole: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
  }

  /**
   * Check multiple permissions
   */
  hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  /**
   * Check if user has any of the permissions
   */
  hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  /**
   * Generate JWT token
   */
  generateToken(
    userId: string,
    role: UserRole,
    expiresIn: string = '1h'
  ): { token: string; refreshToken: string } {
    const payload = {
      userId,
      role,
      permissions: ROLE_PERMISSIONS[role],
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn,
      issuer: 'jarvish',
      audience: 'jarvish-api',
    });

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      this.jwtSecret,
      { expiresIn: '30d' }
    );

    return { token, refreshToken };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'jarvish',
        audience: 'jarvish-api',
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Create user session
   */
  async createSession(
    userId: string,
    role: UserRole,
    ipAddress: string,
    userAgent: string,
    deviceId?: string
  ): Promise<Session> {
    const { token, refreshToken } = this.generateToken(userId, role);
    
    const session: Session = {
      id: crypto.randomUUID(),
      userId,
      token,
      refreshToken,
      ipAddress,
      userAgent,
      deviceId,
      mfaVerified: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      lastActivity: new Date(),
      isActive: true,
    };

    this.sessionStore.set(session.id, session);
    return session;
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<Session | null> {
    const session = this.sessionStore.get(sessionId);
    
    if (!session) return null;
    
    if (!session.isActive) return null;
    
    if (session.expiresAt < new Date()) {
      session.isActive = false;
      return null;
    }

    // Update last activity
    session.lastActivity = new Date();
    
    // Extend session if active
    const timeSinceCreation = Date.now() - session.createdAt.getTime();
    if (timeSinceCreation < 30 * 60 * 1000) { // Less than 30 minutes
      session.expiresAt = new Date(Date.now() + 3600000); // Extend by 1 hour
    }

    return session;
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    const session = this.sessionStore.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessionStore.delete(sessionId);
    }
  }

  /**
   * Setup MFA for user
   */
  async setupMFA(userId: string, method: 'totp' | 'sms' | 'email' | 'biometric' = 'totp'): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `JARVISH (${userId})`,
      issuer: 'JARVISH Financial Advisory',
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Store MFA config
    const mfaConfig: MFAConfig = {
      userId,
      secret: secret.base32,
      backupCodes,
      enabled: false,
      method,
    };

    this.mfaStore.set(userId, mfaConfig);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Verify MFA token
   */
  async verifyMFA(userId: string, token: string): Promise<boolean> {
    const mfaConfig = this.mfaStore.get(userId);
    
    if (!mfaConfig || !mfaConfig.enabled) {
      return false;
    }

    // Check if it's a backup code
    if (mfaConfig.backupCodes.includes(token)) {
      // Remove used backup code
      mfaConfig.backupCodes = mfaConfig.backupCodes.filter(code => code !== token);
      return true;
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: mfaConfig.secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps tolerance
    });

    if (verified) {
      mfaConfig.verifiedAt = new Date();
    }

    return verified;
  }

  /**
   * Enable MFA after verification
   */
  async enableMFA(userId: string): Promise<void> {
    const mfaConfig = this.mfaStore.get(userId);
    if (mfaConfig) {
      mfaConfig.enabled = true;
    }
  }

  /**
   * Generate API key
   */
  async generateAPIKey(
    userId: string,
    name: string,
    permissions: Permission[],
    rateLimit: number = 1000,
    expiresIn?: number
  ): Promise<APIKey> {
    const apiKey: APIKey = {
      id: crypto.randomUUID(),
      key: `jv_${crypto.randomBytes(32).toString('hex')}`,
      name,
      userId,
      permissions,
      rateLimit,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn) : undefined,
      createdAt: new Date(),
      isActive: true,
    };

    this.apiKeyStore.set(apiKey.key, apiKey);
    return apiKey;
  }

  /**
   * Validate API key
   */
  async validateAPIKey(key: string): Promise<APIKey | null> {
    const apiKey = this.apiKeyStore.get(key);
    
    if (!apiKey || !apiKey.isActive) {
      return null;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      apiKey.isActive = false;
      return null;
    }

    // Update last used
    apiKey.lastUsedAt = new Date();
    
    return apiKey;
  }

  /**
   * Revoke API key
   */
  async revokeAPIKey(key: string): Promise<void> {
    const apiKey = this.apiKeyStore.get(key);
    if (apiKey) {
      apiKey.isActive = false;
      this.apiKeyStore.delete(key);
    }
  }

  /**
   * Check resource access
   */
  async checkResourceAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string
  ): Promise<boolean> {
    // Implement resource-level access control
    // This would typically check against a database of resource permissions
    
    // For now, return true for demonstration
    return true;
  }

  /**
   * Implement attribute-based access control (ABAC)
   */
  async evaluateABACPolicy(
    subject: any,
    resource: any,
    action: string,
    environment: any
  ): Promise<boolean> {
    // Evaluate complex attribute-based policies
    // Example: Check time-based access, location-based access, etc.
    
    // Check time-based access
    const currentHour = new Date().getHours();
    if (environment.restrictedHours && 
        (currentHour < environment.restrictedHours.start || 
         currentHour > environment.restrictedHours.end)) {
      return false;
    }

    // Check location-based access
    if (environment.allowedRegions && 
        !environment.allowedRegions.includes(subject.region)) {
      return false;
    }

    // Check resource ownership
    if (resource.ownerId && resource.ownerId !== subject.userId) {
      return false;
    }

    return true;
  }

  /**
   * Implement dynamic authorization
   */
  async getDynamicPermissions(
    userId: string,
    context: any
  ): Promise<Permission[]> {
    const basePermissions = [...ROLE_PERMISSIONS[context.role] || []];
    
    // Add context-specific permissions
    if (context.isTeamLead) {
      basePermissions.push(Permission.CONTENT_APPROVE);
    }

    if (context.isComplianceReviewer) {
      basePermissions.push(Permission.COMPLIANCE_AUDIT);
    }

    // Remove permissions based on restrictions
    if (context.isRestricted) {
      return basePermissions.filter(p => 
        !p.includes('delete') && !p.includes('approve')
      );
    }

    return basePermissions;
  }

  /**
   * Audit access attempt
   */
  async auditAccess(
    userId: string,
    resource: string,
    action: string,
    granted: boolean,
    metadata?: any
  ): Promise<void> {
    const auditLog = {
      timestamp: new Date(),
      userId,
      resource,
      action,
      granted,
      metadata,
    };

    // Store audit log (implement actual storage)
    console.log('Access audit:', auditLog);
  }

  /**
   * Get user's effective permissions
   */
  async getEffectivePermissions(
    userId: string,
    role: UserRole,
    context?: any
  ): Promise<Permission[]> {
    let permissions = [...ROLE_PERMISSIONS[role] || []];

    // Apply dynamic permissions
    if (context) {
      permissions = await this.getDynamicPermissions(userId, { ...context, role });
    }

    // Remove duplicates
    return [...new Set(permissions)];
  }

  /**
   * Implement zero-trust verification
   */
  async verifyZeroTrust(
    request: any
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Verify device trust
    if (!request.deviceId || !this.isDeviceTrusted(request.deviceId)) {
      return { allowed: false, reason: 'Untrusted device' };
    }

    // Verify network location
    if (!this.isNetworkTrusted(request.ipAddress)) {
      return { allowed: false, reason: 'Untrusted network' };
    }

    // Verify user behavior
    if (!await this.isUserBehaviorNormal(request.userId, request)) {
      return { allowed: false, reason: 'Abnormal user behavior detected' };
    }

    // Verify request context
    if (!this.isRequestContextValid(request)) {
      return { allowed: false, reason: 'Invalid request context' };
    }

    return { allowed: true };
  }

  // Helper methods

  private isDeviceTrusted(deviceId: string): boolean {
    // Implement device trust verification
    return true;
  }

  private isNetworkTrusted(ipAddress: string): boolean {
    // Implement network trust verification
    const trustedNetworks = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
    // Check if IP is in trusted network ranges
    return true;
  }

  private async isUserBehaviorNormal(userId: string, request: any): Promise<boolean> {
    // Implement user behavior analysis
    // Check for unusual patterns, locations, times, etc.
    return true;
  }

  private isRequestContextValid(request: any): boolean {
    // Validate request headers, signatures, etc.
    return true;
  }
}

export default AccessControlManager;