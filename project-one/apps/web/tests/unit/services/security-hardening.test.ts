/**
 * Security Hardening Service Unit Tests
 * Testing comprehensive security measures
 */

import { SecurityHardeningService } from '@/lib/services/security-hardening';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/lib/redis';
import crypto from 'crypto';
import DOMPurify from 'isomorphic-dompurify';
import rateLimit from 'express-rate-limit';

// Mock external dependencies
jest.mock('@supabase/supabase-js');
jest.mock('@/lib/redis');
jest.mock('crypto');
jest.mock('isomorphic-dompurify');
jest.mock('express-rate-limit');
jest.mock('helmet');

describe('SecurityHardeningService', () => {
  let securityService: SecurityHardeningService;
  let mockSupabase: any;
  let mockRedis: any;

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis()
    };

    // Mock Redis client
    mockRedis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn()
    };

    // Mock crypto
    (crypto.randomBytes as jest.Mock) = jest.fn()
      .mockReturnValue(Buffer.from('1234567890abcdef', 'hex'));
    
    (crypto.createHmac as jest.Mock) = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hmac_signature')
    });

    (crypto.createHash as jest.Mock) = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hashed_value')
    });

    (crypto.pbkdf2Sync as jest.Mock) = jest.fn()
      .mockReturnValue(Buffer.from('hashed_password', 'hex'));

    (crypto.createCipheriv as jest.Mock) = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue('encrypted_'),
      final: jest.fn().mockReturnValue('data'),
      getAuthTag: jest.fn().mockReturnValue(Buffer.from('authtag', 'hex'))
    });

    (crypto.createDecipheriv as jest.Mock) = jest.fn().mockReturnValue({
      setAuthTag: jest.fn(),
      update: jest.fn().mockReturnValue('decrypted_'),
      final: jest.fn().mockReturnValue('data')
    });

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    (redis.get as jest.Mock) = mockRedis.get;
    (redis.setex as jest.Mock) = mockRedis.setex;
    (redis.del as jest.Mock) = mockRedis.del;

    // Mock environment variable
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.NODE_ENV = 'production';

    // Create service instance
    securityService = new SecurityHardeningService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSecurityHeaders', () => {
    it('should return comprehensive security headers', () => {
      const headers = securityService.getSecurityHeaders();

      expect(headers).toEqual({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Content-Security-Policy': expect.stringContaining("default-src 'self'"),
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        'X-DNS-Prefetch-Control': 'off',
        'X-Download-Options': 'noopen',
        'X-Permitted-Cross-Domain-Policies': 'none'
      });
    });

    it('should generate proper CSP directives', () => {
      const headers = securityService.getSecurityHeaders();
      const csp = headers['Content-Security-Policy'];

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).toContain("connect-src 'self' https://api.openai.com https://api.razorpay.com");
      expect(csp).toContain("frame-src 'self' https://api.razorpay.com");
    });
  });

  describe('createRateLimiter', () => {
    it('should create rate limiter with default config', () => {
      const mockRateLimiter = jest.fn();
      (rateLimit as jest.Mock).mockReturnValue(mockRateLimiter);

      const limiter = securityService.createRateLimiter();

      expect(rateLimit).toHaveBeenCalledWith({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
        handler: expect.any(Function)
      });
    });

    it('should create rate limiter with custom config', () => {
      const mockRateLimiter = jest.fn();
      (rateLimit as jest.Mock).mockReturnValue(mockRateLimiter);

      const customOptions = {
        windowMs: 5 * 60 * 1000,
        maxRequests: 50,
        message: 'Custom rate limit message'
      };

      securityService.createRateLimiter(customOptions);

      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: customOptions.windowMs,
          max: customOptions.maxRequests,
          message: customOptions.message
        })
      );
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML input', () => {
      const dangerousHtml = '<script>alert("XSS")</script><b>Safe text</b>';
      const sanitized = '<b>Safe text</b>';

      (DOMPurify.sanitize as jest.Mock).mockReturnValue(sanitized);

      const result = securityService.sanitizeInput(dangerousHtml, 'html');

      expect(DOMPurify.sanitize).toHaveBeenCalledWith(
        dangerousHtml,
        expect.objectContaining({
          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
          ALLOWED_ATTR: ['href', 'target']
        })
      );
      expect(result).toBe(sanitized);
    });

    it('should sanitize SQL input', () => {
      const sqlInput = "'; DROP TABLE users; --";
      const result = securityService.sanitizeInput(sqlInput, 'sql');

      expect(result).toBe("\\'\\; DROP TABLE users\\; \\-\\-");
    });

    it('should sanitize text input', () => {
      const textInput = '<script>alert("XSS")</script>Very long text'.repeat(1000);
      const result = securityService.sanitizeInput(textInput, 'text');

      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('validateFileUpload', () => {
    it('should validate allowed file types', async () => {
      const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB

      const result = await securityService.validateFileUpload(validFile);

      expect(result).toEqual({ valid: true });
    });

    it('should reject oversized files', async () => {
      const largeFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(largeFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      const result = await securityService.validateFileUpload(largeFile);

      expect(result).toEqual({
        valid: false,
        error: 'File size exceeds limit'
      });
    });

    it('should reject disallowed file types', async () => {
      const execFile = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });

      const result = await securityService.validateFileUpload(execFile);

      expect(result).toEqual({
        valid: false,
        error: 'File type not allowed'
      });
    });

    it('should detect malware signatures', async () => {
      const maliciousFile = new File([new Uint8Array([0x4D, 0x5A])], 'test.pdf', { 
        type: 'application/pdf' 
      });

      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await securityService.validateFileUpload(maliciousFile);

      expect(result).toEqual({
        valid: false,
        error: 'Suspicious file detected'
      });

      expect(mockSupabase.insert).toHaveBeenCalled(); // Threat logged
    });
  });

  describe('encryptData / decryptData', () => {
    it('should encrypt and decrypt data successfully', () => {
      const originalData = 'Sensitive financial data';

      const encrypted = securityService.encryptData(originalData);

      expect(encrypted).toEqual({
        encrypted: 'encrypted_data',
        iv: expect.any(String),
        tag: expect.any(String)
      });

      const decrypted = securityService.decryptData(
        encrypted.encrypted,
        encrypted.iv,
        encrypted.tag
      );

      expect(decrypted).toBe('decrypted_data');
    });
  });

  describe('generateSecureToken', () => {
    it('should generate secure token of specified length', () => {
      const token = securityService.generateSecureToken(32);

      expect(token).toHaveLength(32);
      expect(crypto.randomBytes).toHaveBeenCalledWith(16); // 16 bytes = 32 hex chars
    });

    it('should generate different tokens on each call', () => {
      (crypto.randomBytes as jest.Mock)
        .mockReturnValueOnce(Buffer.from('1111111111111111', 'hex'))
        .mockReturnValueOnce(Buffer.from('2222222222222222', 'hex'));

      const token1 = securityService.generateSecureToken();
      const token2 = securityService.generateSecureToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('hashData / verifyHash', () => {
    it('should hash and verify data', () => {
      const data = 'password123';
      const salt = 'randomsalt';

      (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from(salt, 'hex'));

      const hashed = securityService.hashData(data);

      expect(hashed).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);

      // Mock verification
      (crypto.pbkdf2Sync as jest.Mock).mockReturnValue(
        Buffer.from(hashed.split(':')[1], 'hex')
      );

      const isValid = securityService.verifyHash(data, hashed);
      expect(isValid).toBe(true);
    });

    it('should reject invalid hash verification', () => {
      const data = 'password123';
      const hashedData = 'salt:differenthash';

      (crypto.pbkdf2Sync as jest.Mock).mockReturnValue(
        Buffer.from('wronghash', 'hex')
      );

      const isValid = securityService.verifyHash(data, hashedData);
      expect(isValid).toBe(false);
    });
  });

  describe('detectSQLInjection', () => {
    it('should detect SQL injection attempts', () => {
      const injections = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin' --",
        "' UNION SELECT * FROM passwords",
        "1; DELETE FROM advisors WHERE 1=1"
      ];

      injections.forEach(input => {
        expect(securityService.detectSQLInjection(input)).toBe(true);
      });
    });

    it('should not flag legitimate input', () => {
      const legitimateInputs = [
        'John Doe',
        'user@example.com',
        'This is a normal comment about investing',
        '9876543210'
      ];

      legitimateInputs.forEach(input => {
        expect(securityService.detectSQLInjection(input)).toBe(false);
      });
    });
  });

  describe('detectXSS', () => {
    it('should detect XSS attempts', () => {
      const xssAttempts = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<svg onload=alert("XSS")>',
        'eval("alert(1)")',
        'document.cookie'
      ];

      xssAttempts.forEach(input => {
        expect(securityService.detectXSS(input)).toBe(true);
      });
    });

    it('should not flag legitimate HTML-like text', () => {
      const legitimateInputs = [
        'Returns < 10% are considered low',
        'Invest > 5000 for better returns',
        'Email me at user@example.com'
      ];

      legitimateInputs.forEach(input => {
        expect(securityService.detectXSS(input)).toBe(false);
      });
    });
  });

  describe('validateRequest', () => {
    it('should validate clean request', async () => {
      const req = {
        ip: '192.168.1.1',
        headers: { 'user-agent': 'Mozilla/5.0' },
        body: { name: 'John Doe', email: 'john@example.com' },
        query: { page: '1' },
        params: { id: '123' }
      };

      const result = await securityService.validateRequest(req);

      expect(result).toEqual({
        safe: true,
        threats: []
      });
    });

    it('should detect SQL injection in request', async () => {
      const req = {
        ip: '192.168.1.1',
        headers: { 'user-agent': 'Mozilla/5.0' },
        body: { 
          name: "'; DROP TABLE users; --",
          email: 'test@example.com'
        },
        query: {},
        params: {}
      };

      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await securityService.validateRequest(req);

      expect(result.safe).toBe(false);
      expect(result.threats).toHaveLength(1);
      expect(result.threats[0]).toEqual({
        type: 'sql_injection',
        severity: 'high',
        details: 'SQL injection attempt in field: name',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        timestamp: expect.any(Date)
      });
    });

    it('should detect XSS in request', async () => {
      const req = {
        ip: '192.168.1.1',
        headers: { 'user-agent': 'Chrome' },
        body: {},
        query: { 
          search: '<script>alert("XSS")</script>' 
        },
        params: {}
      };

      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await securityService.validateRequest(req);

      expect(result.safe).toBe(false);
      expect(result.threats[0].type).toBe('xss');
    });
  });

  describe('CSRF Protection', () => {
    it('should generate CSRF token', () => {
      const sessionId = 'session_123';

      mockRedis.setex.mockResolvedValue('OK');

      const token = securityService.generateCSRFToken(sessionId);

      expect(token).toBeTruthy();
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `csrf:${sessionId}`,
        3600,
        token
      );
    });

    it('should verify valid CSRF token', async () => {
      const sessionId = 'session_123';
      const token = 'valid_token';

      mockRedis.get.mockResolvedValue(token);

      const isValid = await securityService.verifyCSRFToken(sessionId, token);

      expect(isValid).toBe(true);
    });

    it('should reject invalid CSRF token', async () => {
      const sessionId = 'session_123';

      mockRedis.get.mockResolvedValue('different_token');

      const isValid = await securityService.verifyCSRFToken(sessionId, 'wrong_token');

      expect(isValid).toBe(false);
    });
  });

  describe('Session Security', () => {
    it('should create secure session', async () => {
      const userId = 'user_123';
      const metadata = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      mockRedis.setex.mockResolvedValue('OK');

      const sessionId = await securityService.createSecureSession(userId, metadata);

      expect(sessionId).toBeTruthy();
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `session:${sessionId}`,
        86400, // 24 hours in seconds
        expect.any(String)
      );
    });

    it('should validate active session', async () => {
      const sessionId = 'session_123';
      const sessionData = {
        encrypted: 'encrypted_data',
        iv: 'iv_value',
        tag: 'tag_value'
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(sessionData));

      const result = await securityService.validateSession(sessionId);

      expect(result.valid).toBe(true);
      expect(result.data).toBeTruthy();
    });

    it('should invalidate expired session', async () => {
      const sessionId = 'session_123';
      const oldSessionData = {
        user_id: 'user_123',
        created_at: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        last_activity: Date.now() - 25 * 60 * 60 * 1000
      };

      mockRedis.get.mockResolvedValue(JSON.stringify({
        encrypted: 'encrypted',
        iv: 'iv',
        tag: 'tag'
      }));

      (crypto.createDecipheriv as jest.Mock).mockReturnValue({
        setAuthTag: jest.fn(),
        update: jest.fn().mockReturnValue(JSON.stringify(oldSessionData)),
        final: jest.fn().mockReturnValue('')
      });

      const result = await securityService.validateSession(sessionId);

      expect(result.valid).toBe(false);
      expect(mockRedis.del).toHaveBeenCalledWith(`session:${sessionId}`);
    });

    it('should update rolling session', async () => {
      const sessionId = 'session_123';
      const sessionData = {
        user_id: 'user_123',
        created_at: Date.now() - 1000,
        last_activity: Date.now() - 1000
      };

      mockRedis.get.mockResolvedValue(JSON.stringify({
        encrypted: 'encrypted',
        iv: 'iv',
        tag: 'tag'
      }));

      (crypto.createDecipheriv as jest.Mock).mockReturnValue({
        setAuthTag: jest.fn(),
        update: jest.fn().mockReturnValue(JSON.stringify(sessionData)),
        final: jest.fn().mockReturnValue('')
      });

      mockRedis.setex.mockResolvedValue('OK');

      const result = await securityService.validateSession(sessionId);

      expect(result.valid).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalled(); // Session updated
    });
  });

  describe('IP Blocking', () => {
    it('should block IP after multiple threats', async () => {
      const maliciousIp = '192.168.1.100';
      
      // Mock 5 recent threats from same IP
      mockSupabase.order.mockResolvedValue({
        data: Array(5).fill({
          ip_address: maliciousIp,
          timestamp: new Date()
        })
      });

      mockRedis.setex.mockResolvedValue('OK');
      mockSupabase.insert.mockResolvedValue({ error: null });

      // Trigger threat detection
      const req = {
        ip: maliciousIp,
        headers: { 'user-agent': 'Bot' },
        body: { sql: "'; DROP TABLE users; --" },
        query: {},
        params: {}
      };

      await securityService.validateRequest(req);

      // Verify IP was blocked
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `blocked:${maliciousIp}`,
        86400,
        'true'
      );
    });

    it('should check if IP is blocked', async () => {
      const blockedIp = '192.168.1.100';

      mockRedis.get.mockResolvedValue('true');

      const isBlocked = await securityService.isIPBlocked(blockedIp);

      expect(isBlocked).toBe(true);
    });

    it('should allow unblocked IP', async () => {
      mockRedis.get.mockResolvedValue(null);

      const isBlocked = await securityService.isIPBlocked('192.168.1.1');

      expect(isBlocked).toBe(false);
    });
  });

  describe('Security Event Logging', () => {
    it('should log critical threats', async () => {
      const req = {
        ip: '192.168.1.1',
        headers: { 'user-agent': 'Bot' },
        body: { 
          data: "'; DELETE FROM advisors; --"
        },
        query: {},
        params: {}
      };

      mockSupabase.insert.mockResolvedValue({ error: null });
      mockSupabase.order.mockResolvedValue({ data: [] });

      await securityService.validateRequest(req);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sql_injection',
          severity: 'high',
          ip_address: '192.168.1.1'
        })
      );
    });
  });
});