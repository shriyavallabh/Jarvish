/**
 * Security Hardening Service
 * Implements comprehensive security measures for production
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/lib/redis';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import DOMPurify from 'isomorphic-dompurify';

interface SecurityConfig {
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    message: string;
  };
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
  };
  session: {
    maxAge: number;
    rolling: boolean;
    secure: boolean;
  };
  csp: {
    directives: Record<string, string[]>;
  };
}

interface ThreatDetection {
  type: 'sql_injection' | 'xss' | 'csrf' | 'brute_force' | 'suspicious_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
}

export class SecurityHardeningService {
  private supabase: any;
  private readonly config: SecurityConfig;
  private readonly encryptionKey: Buffer;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

    this.config = {
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        message: 'Too many requests, please try again later'
      },
      encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16
      },
      session: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        rolling: true,
        secure: process.env.NODE_ENV === 'production'
      },
      csp: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://api.openai.com', 'https://api.razorpay.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'", 'https://api.razorpay.com']
        }
      }
    };
  }

  /**
   * Get security headers configuration
   */
  getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Content-Security-Policy': this.generateCSP(),
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'X-DNS-Prefetch-Control': 'off',
      'X-Download-Options': 'noopen',
      'X-Permitted-Cross-Domain-Policies': 'none'
    };
  }

  /**
   * Generate Content Security Policy
   */
  private generateCSP(): string {
    const directives = Object.entries(this.config.csp.directives)
      .map(([key, values]) => {
        const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${directive} ${values.join(' ')}`;
      })
      .join('; ');

    return directives;
  }

  /**
   * Create rate limiter for specific endpoints
   */
  createRateLimiter(options?: Partial<typeof this.config.rateLimiting>) {
    const config = { ...this.config.rateLimiting, ...options };

    return rateLimit({
      windowMs: config.windowMs,
      max: config.maxRequests,
      message: config.message,
      standardHeaders: true,
      legacyHeaders: false,
      handler: async (req, res) => {
        // Log rate limit violation
        await this.logSecurityEvent({
          type: 'rate_limit_exceeded',
          ip: req.ip,
          endpoint: req.path,
          timestamp: new Date()
        });

        res.status(429).json({
          error: config.message,
          retryAfter: config.windowMs / 1000
        });
      }
    });
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string, type: 'html' | 'text' | 'sql' = 'text'): string {
    let sanitized = input;

    switch (type) {
      case 'html':
        // Remove dangerous HTML
        sanitized = DOMPurify.sanitize(input, {
          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
          ALLOWED_ATTR: ['href', 'target']
        });
        break;

      case 'sql':
        // Escape SQL special characters
        sanitized = input
          .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
            switch (char) {
              case "\0": return "\\0";
              case "\x08": return "\\b";
              case "\x09": return "\\t";
              case "\x1a": return "\\z";
              case "\n": return "\\n";
              case "\r": return "\\r";
              case "\"":
              case "'":
              case "\\":
              case "%": return "\\" + char;
              default: return char;
            }
          });
        break;

      case 'text':
      default:
        // Basic text sanitization
        sanitized = input
          .replace(/[<>]/g, '')
          .trim()
          .slice(0, 10000); // Limit length
        break;
    }

    return sanitized;
  }

  /**
   * Validate and sanitize file uploads
   */
  async validateFileUpload(
    file: File,
    allowedTypes: string[] = ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: number = 5 * 1024 * 1024 // 5MB
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check file size
      if (file.size > maxSize) {
        return { valid: false, error: 'File size exceeds limit' };
      }

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'File type not allowed' };
      }

      // Check file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      const validExtensions = allowedTypes.map(type => {
        const ext = type.split('/')[1];
        return ext === 'jpeg' ? 'jpg' : ext;
      });

      if (!extension || !validExtensions.includes(extension)) {
        return { valid: false, error: 'Invalid file extension' };
      }

      // Scan for malware signatures (basic check)
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      // Check for common malware signatures
      const malwareSignatures = [
        [0x4D, 0x5A], // EXE
        [0x7F, 0x45, 0x4C, 0x46], // ELF
        [0x23, 0x21], // Script shebang
      ];

      for (const signature of malwareSignatures) {
        if (this.checkSignature(bytes, signature)) {
          await this.logThreatDetection({
            type: 'suspicious_pattern',
            severity: 'high',
            details: 'Potential malware signature detected',
            ip_address: '',
            user_agent: '',
            timestamp: new Date()
          });
          return { valid: false, error: 'Suspicious file detected' };
        }
      }

      return { valid: true };

    } catch (error) {
      console.error('File validation error:', error);
      return { valid: false, error: 'File validation failed' };
    }
  }

  /**
   * Check byte signature
   */
  private checkSignature(bytes: Uint8Array, signature: number[]): boolean {
    if (bytes.length < signature.length) return false;
    
    for (let i = 0; i < signature.length; i++) {
      if (bytes[i] !== signature[i]) return false;
    }
    
    return true;
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(this.config.encryption.ivLength);
    const cipher = crypto.createCipheriv(
      this.config.encryption.algorithm,
      this.encryptionKey,
      iv
    );

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encrypted: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipheriv(
      this.config.encryption.algorithm,
      this.encryptionKey,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate secure token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash sensitive data (one-way)
   */
  hashData(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512')
      .toString('hex');
    
    return `${actualSalt}:${hash}`;
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hashedData: string): boolean {
    const [salt, hash] = hashedData.split(':');
    const verifyHash = crypto
      .pbkdf2Sync(data, salt, 10000, 64, 'sha512')
      .toString('hex');
    
    return hash === verifyHash;
  }

  /**
   * Detect SQL injection attempts
   */
  detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi,
      /(--|\||;|\/\*|\*\/|xp_|sp_|0x)/gi,
      /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
      /(\bAND\b\s*\d+\s*=\s*\d+)/gi,
      /(\'|\"|`)\s*\bOR\b\s*(\'|\"|`)\d*(\'|\"|`)?\s*=\s*(\'|\"|`)?\d*/gi
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Detect XSS attempts
   */
  detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*onerror\s*=/gi,
      /<svg[^>]*onload\s*=/gi,
      /eval\s*\(/gi,
      /document\.(write|writeln|cookie|location)/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Validate request for threats
   */
  async validateRequest(req: any): Promise<{ safe: boolean; threats: ThreatDetection[] }> {
    const threats: ThreatDetection[] = [];
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    // Check all input fields
    const inputs = { ...req.body, ...req.query, ...req.params };

    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === 'string') {
        // Check for SQL injection
        if (this.detectSQLInjection(value)) {
          threats.push({
            type: 'sql_injection',
            severity: 'high',
            details: `SQL injection attempt in field: ${key}`,
            ip_address: ip,
            user_agent: userAgent,
            timestamp: new Date()
          });
        }

        // Check for XSS
        if (this.detectXSS(value)) {
          threats.push({
            type: 'xss',
            severity: 'high',
            details: `XSS attempt in field: ${key}`,
            ip_address: ip,
            user_agent: userAgent,
            timestamp: new Date()
          });
        }
      }
    }

    // Log threats
    for (const threat of threats) {
      await this.logThreatDetection(threat);
    }

    return {
      safe: threats.length === 0,
      threats
    };
  }

  /**
   * Implement CSRF protection
   */
  generateCSRFToken(sessionId: string): string {
    const token = crypto
      .createHmac('sha256', this.encryptionKey)
      .update(sessionId + Date.now())
      .digest('hex');

    // Store token with expiry
    redis.setex(`csrf:${sessionId}`, 3600, token);

    return token;
  }

  /**
   * Verify CSRF token
   */
  async verifyCSRFToken(sessionId: string, token: string): Promise<boolean> {
    const storedToken = await redis.get(`csrf:${sessionId}`);
    return storedToken === token;
  }

  /**
   * Implement session security
   */
  async createSecureSession(userId: string, metadata?: any): Promise<string> {
    const sessionId = this.generateSecureToken(32);
    const sessionData = {
      user_id: userId,
      created_at: Date.now(),
      last_activity: Date.now(),
      ip_address: metadata?.ip,
      user_agent: metadata?.userAgent,
      ...metadata
    };

    // Encrypt session data
    const { encrypted, iv, tag } = this.encryptData(JSON.stringify(sessionData));

    // Store in Redis with expiry
    await redis.setex(
      `session:${sessionId}`,
      this.config.session.maxAge / 1000,
      JSON.stringify({ encrypted, iv, tag })
    );

    return sessionId;
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<{ valid: boolean; data?: any }> {
    try {
      const sessionData = await redis.get(`session:${sessionId}`);
      if (!sessionData) {
        return { valid: false };
      }

      const { encrypted, iv, tag } = JSON.parse(sessionData);
      const decrypted = this.decryptData(encrypted, iv, tag);
      const data = JSON.parse(decrypted);

      // Check session expiry
      if (Date.now() - data.created_at > this.config.session.maxAge) {
        await redis.del(`session:${sessionId}`);
        return { valid: false };
      }

      // Update last activity if rolling sessions
      if (this.config.session.rolling) {
        data.last_activity = Date.now();
        const updated = this.encryptData(JSON.stringify(data));
        await redis.setex(
          `session:${sessionId}`,
          this.config.session.maxAge / 1000,
          JSON.stringify(updated)
        );
      }

      return { valid: true, data };

    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false };
    }
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: any) {
    await this.supabase
      .from('security_events')
      .insert({
        ...event,
        timestamp: new Date()
      });
  }

  /**
   * Log threat detection
   */
  private async logThreatDetection(threat: ThreatDetection) {
    // Log to database
    await this.supabase
      .from('threat_detections')
      .insert(threat);

    // Alert if critical
    if (threat.severity === 'critical') {
      // Send alert to security team
      console.error('CRITICAL THREAT DETECTED:', threat);
    }

    // Block IP if multiple threats
    const recentThreats = await this.getRecentThreats(threat.ip_address);
    if (recentThreats.length >= 5) {
      await this.blockIP(threat.ip_address);
    }
  }

  /**
   * Get recent threats from IP
   */
  private async getRecentThreats(ip: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('threat_detections')
      .select('*')
      .eq('ip_address', ip)
      .gte('timestamp', new Date(Date.now() - 3600000)) // Last hour
      .order('timestamp', { ascending: false });

    return data || [];
  }

  /**
   * Block IP address
   */
  private async blockIP(ip: string) {
    await redis.setex(`blocked:${ip}`, 86400, 'true'); // 24 hour block
    
    await this.supabase
      .from('blocked_ips')
      .insert({
        ip_address: ip,
        blocked_at: new Date(),
        reason: 'Multiple threat detections'
      });
  }

  /**
   * Check if IP is blocked
   */
  async isIPBlocked(ip: string): Promise<boolean> {
    const blocked = await redis.get(`blocked:${ip}`);
    return blocked === 'true';
  }
}