/**
 * Security Monitor
 * Real-time security monitoring, threat detection, and incident response
 */

import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Security event types
export enum SecurityEventType {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH = 'data_breach',
  API_ABUSE = 'api_abuse',
  SQL_INJECTION = 'sql_injection',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTEMPT = 'csrf_attempt',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  MALWARE_DETECTED = 'malware_detected',
  CONFIGURATION_CHANGE = 'configuration_change',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  SESSION_HIJACKING = 'session_hijacking',
  ACCOUNT_TAKEOVER = 'account_takeover',
}

// Threat severity levels
export enum ThreatSeverity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Security event schema
const SecurityEventSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  type: z.nativeEnum(SecurityEventType),
  severity: z.nativeEnum(ThreatSeverity),
  userId: z.string().optional(),
  ipAddress: z.string(),
  userAgent: z.string().optional(),
  endpoint: z.string().optional(),
  method: z.string().optional(),
  payload: z.any().optional(),
  description: z.string(),
  metadata: z.record(z.any()).optional(),
  blocked: z.boolean().default(false),
  notified: z.boolean().default(false),
});

export type SecurityEvent = z.infer<typeof SecurityEventSchema>;

// Threat detection rule schema
const ThreatRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  pattern: z.string(),
  eventTypes: z.array(z.nativeEnum(SecurityEventType)),
  threshold: z.number(),
  timeWindow: z.number(), // minutes
  severity: z.nativeEnum(ThreatSeverity),
  action: z.enum(['log', 'alert', 'block', 'quarantine']),
  enabled: z.boolean().default(true),
});

export type ThreatRule = z.infer<typeof ThreatRuleSchema>;

// Security incident schema
const SecurityIncidentSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  severity: z.nativeEnum(ThreatSeverity),
  status: z.enum(['open', 'investigating', 'mitigated', 'resolved', 'false_positive']),
  events: z.array(SecurityEventSchema),
  affectedUsers: z.array(z.string()),
  description: z.string(),
  mitigation: z.string().optional(),
  rootCause: z.string().optional(),
  assignedTo: z.string().optional(),
  resolvedAt: z.date().optional(),
  resolvedBy: z.string().optional(),
});

export type SecurityIncident = z.infer<typeof SecurityIncidentSchema>;

export class SecurityMonitor {
  private supabase: any;
  private eventBuffer: SecurityEvent[] = [];
  private threatRules: Map<string, ThreatRule> = new Map();
  private activeIncidents: Map<string, SecurityIncident> = new Map();
  private blockedIPs: Set<string> = new Set();
  private rateLimitMap: Map<string, number[]> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.initializeThreatRules();
    this.startMonitoring();
  }

  /**
   * Initialize default threat detection rules
   */
  private initializeThreatRules(): void {
    const defaultRules: ThreatRule[] = [
      {
        id: 'brute-force',
        name: 'Brute Force Detection',
        description: 'Detect multiple failed login attempts',
        pattern: 'login_failure',
        eventTypes: [SecurityEventType.LOGIN_FAILURE],
        threshold: 5,
        timeWindow: 5,
        severity: ThreatSeverity.HIGH,
        action: 'block',
        enabled: true,
      },
      {
        id: 'rate-limit',
        name: 'API Rate Limiting',
        description: 'Detect excessive API requests',
        pattern: 'api_request',
        eventTypes: [SecurityEventType.RATE_LIMIT_EXCEEDED],
        threshold: 100,
        timeWindow: 1,
        severity: ThreatSeverity.MEDIUM,
        action: 'block',
        enabled: true,
      },
      {
        id: 'sql-injection',
        name: 'SQL Injection Detection',
        description: 'Detect SQL injection attempts',
        pattern: 'sql_pattern',
        eventTypes: [SecurityEventType.SQL_INJECTION],
        threshold: 1,
        timeWindow: 60,
        severity: ThreatSeverity.CRITICAL,
        action: 'block',
        enabled: true,
      },
      {
        id: 'xss-detection',
        name: 'XSS Attack Detection',
        description: 'Detect cross-site scripting attempts',
        pattern: 'xss_pattern',
        eventTypes: [SecurityEventType.XSS_ATTEMPT],
        threshold: 1,
        timeWindow: 60,
        severity: ThreatSeverity.HIGH,
        action: 'block',
        enabled: true,
      },
      {
        id: 'privilege-escalation',
        name: 'Privilege Escalation Detection',
        description: 'Detect unauthorized privilege escalation',
        pattern: 'privilege_change',
        eventTypes: [SecurityEventType.PRIVILEGE_ESCALATION],
        threshold: 1,
        timeWindow: 60,
        severity: ThreatSeverity.CRITICAL,
        action: 'alert',
        enabled: true,
      },
    ];

    defaultRules.forEach(rule => {
      this.threatRules.set(rule.id, rule);
    });
  }

  /**
   * Start security monitoring
   */
  private startMonitoring(): void {
    // Process event buffer every second
    setInterval(() => {
      this.processEventBuffer();
    }, 1000);

    // Clean up old rate limit entries every minute
    setInterval(() => {
      this.cleanupRateLimits();
    }, 60000);

    // Review active incidents every 5 minutes
    setInterval(() => {
      this.reviewActiveIncidents();
    }, 300000);
  }

  /**
   * Log security event
   */
  async logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: SecurityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    // Check for immediate threats
    const threat = this.detectThreat(fullEvent);
    if (threat) {
      await this.handleThreat(fullEvent, threat);
    }

    // Add to buffer for batch processing
    this.eventBuffer.push(fullEvent);

    // Store in database
    await this.storeEvent(fullEvent);
  }

  /**
   * Detect threats based on rules
   */
  private detectThreat(event: SecurityEvent): ThreatRule | null {
    for (const rule of this.threatRules.values()) {
      if (!rule.enabled) continue;

      if (rule.eventTypes.includes(event.type)) {
        // Check if threshold is exceeded
        const recentEvents = this.getRecentEvents(
          event.ipAddress,
          rule.eventTypes,
          rule.timeWindow
        );

        if (recentEvents.length >= rule.threshold) {
          return rule;
        }
      }
    }

    return null;
  }

  /**
   * Handle detected threat
   */
  private async handleThreat(event: SecurityEvent, rule: ThreatRule): Promise<void> {
    console.log(`Threat detected: ${rule.name} for IP ${event.ipAddress}`);

    switch (rule.action) {
      case 'block':
        await this.blockIP(event.ipAddress);
        break;
      case 'alert':
        await this.sendAlert(event, rule);
        break;
      case 'quarantine':
        await this.quarantineUser(event.userId);
        break;
      default:
        await this.logThreat(event, rule);
    }

    // Create or update incident
    await this.createOrUpdateIncident(event, rule);
  }

  /**
   * Block IP address
   */
  async blockIP(ipAddress: string, duration: number = 3600000): Promise<void> {
    this.blockedIPs.add(ipAddress);

    // Store in database
    await this.supabase.from('blocked_ips').insert({
      ip_address: ipAddress,
      blocked_at: new Date(),
      expires_at: new Date(Date.now() + duration),
      reason: 'Automated threat detection',
    });

    // Automatically unblock after duration
    setTimeout(() => {
      this.blockedIPs.delete(ipAddress);
    }, duration);

    console.log(`Blocked IP: ${ipAddress} for ${duration}ms`);
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  /**
   * Check rate limit
   */
  checkRateLimit(
    identifier: string,
    limit: number = 100,
    window: number = 60000
  ): boolean {
    const now = Date.now();
    const requests = this.rateLimitMap.get(identifier) || [];
    
    // Remove old requests outside window
    const validRequests = requests.filter(time => now - time < window);
    
    if (validRequests.length >= limit) {
      // Rate limit exceeded
      this.logEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: ThreatSeverity.MEDIUM,
        ipAddress: identifier,
        description: `Rate limit exceeded: ${validRequests.length} requests in ${window}ms`,
      });
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.rateLimitMap.set(identifier, validRequests);
    
    return true;
  }

  /**
   * Detect SQL injection patterns
   */
  detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER)\b)/gi,
      /(--|\||;|\/\*|\*\/|xp_|sp_|0x)/gi,
      /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
      /(\bAND\b\s*\d+\s*=\s*\d+)/gi,
      /(\'\s*OR\s*\')/gi,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        this.logEvent({
          type: SecurityEventType.SQL_INJECTION,
          severity: ThreatSeverity.CRITICAL,
          ipAddress: 'unknown',
          description: `SQL injection attempt detected: ${input.substring(0, 100)}`,
          payload: input,
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Detect XSS patterns
   */
  detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*onerror\s*=/gi,
      /<svg[^>]*onload\s*=/gi,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        this.logEvent({
          type: SecurityEventType.XSS_ATTEMPT,
          severity: ThreatSeverity.HIGH,
          ipAddress: 'unknown',
          description: `XSS attempt detected: ${input.substring(0, 100)}`,
          payload: input,
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Validate CSRF token
   */
  async validateCSRFToken(token: string, sessionId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('csrf_tokens')
      .select('*')
      .eq('token', token)
      .eq('session_id', sessionId)
      .single();

    if (!data) {
      await this.logEvent({
        type: SecurityEventType.CSRF_ATTEMPT,
        severity: ThreatSeverity.HIGH,
        ipAddress: 'unknown',
        description: 'Invalid CSRF token',
        metadata: { token, sessionId },
      });
      return false;
    }

    return true;
  }

  /**
   * Monitor session activity
   */
  async monitorSession(
    sessionId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const { data: session } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (session) {
      // Check for session hijacking
      if (session.ip_address !== ipAddress || session.user_agent !== userAgent) {
        await this.logEvent({
          type: SecurityEventType.SESSION_HIJACKING,
          severity: ThreatSeverity.CRITICAL,
          ipAddress,
          userAgent,
          description: 'Possible session hijacking detected',
          metadata: {
            sessionId,
            originalIp: session.ip_address,
            originalUserAgent: session.user_agent,
          },
        });
      }
    }
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: any;
    events: SecurityEvent[];
    incidents: SecurityIncident[];
    recommendations: string[];
  }> {
    // Fetch security events
    const { data: events } = await this.supabase
      .from('security_events')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    // Fetch incidents
    const { data: incidents } = await this.supabase
      .from('security_incidents')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Calculate summary statistics
    const summary = {
      totalEvents: events?.length || 0,
      criticalEvents: events?.filter((e: any) => e.severity === 'critical').length || 0,
      highEvents: events?.filter((e: any) => e.severity === 'high').length || 0,
      blockedAttempts: events?.filter((e: any) => e.blocked).length || 0,
      totalIncidents: incidents?.length || 0,
      resolvedIncidents: incidents?.filter((i: any) => i.status === 'resolved').length || 0,
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(events, incidents);

    return {
      summary,
      events: events || [],
      incidents: incidents || [],
      recommendations,
    };
  }

  // Private helper methods

  private async processEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    // Batch insert events
    const { error } = await this.supabase
      .from('security_events')
      .insert(events);

    if (error) {
      console.error('Failed to store security events:', error);
      // Re-add to buffer for retry
      this.eventBuffer.push(...events);
    }
  }

  private getRecentEvents(
    ipAddress: string,
    eventTypes: SecurityEventType[],
    timeWindow: number
  ): SecurityEvent[] {
    const cutoff = Date.now() - timeWindow * 60 * 1000;
    
    return this.eventBuffer.filter(
      event =>
        event.ipAddress === ipAddress &&
        eventTypes.includes(event.type) &&
        event.timestamp.getTime() > cutoff
    );
  }

  private async storeEvent(event: SecurityEvent): Promise<void> {
    const { error } = await this.supabase
      .from('security_events')
      .insert(event);

    if (error) {
      console.error('Failed to store security event:', error);
    }
  }

  private async sendAlert(event: SecurityEvent, rule: ThreatRule): Promise<void> {
    // Implement alert notification (email, SMS, webhook, etc.)
    console.log(`Security Alert: ${rule.name}`, event);
  }

  private async quarantineUser(userId?: string): Promise<void> {
    if (!userId) return;

    const { error } = await this.supabase
      .from('users')
      .update({ status: 'quarantined' })
      .eq('id', userId);

    if (error) {
      console.error('Failed to quarantine user:', error);
    }
  }

  private async logThreat(event: SecurityEvent, rule: ThreatRule): Promise<void> {
    console.log(`Threat logged: ${rule.name}`, event);
  }

  private async createOrUpdateIncident(
    event: SecurityEvent,
    rule: ThreatRule
  ): Promise<void> {
    const incidentKey = `${rule.id}-${event.ipAddress}`;
    let incident = this.activeIncidents.get(incidentKey);

    if (incident) {
      // Update existing incident
      incident.events.push(event);
      incident.updatedAt = new Date();
    } else {
      // Create new incident
      incident = {
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        severity: rule.severity,
        status: 'open',
        events: [event],
        affectedUsers: event.userId ? [event.userId] : [],
        description: `${rule.name}: ${rule.description}`,
      };
      this.activeIncidents.set(incidentKey, incident);
    }

    // Store in database
    await this.supabase
      .from('security_incidents')
      .upsert(incident);
  }

  private cleanupRateLimits(): void {
    const now = Date.now();
    const window = 60000; // 1 minute

    for (const [key, requests] of this.rateLimitMap.entries()) {
      const validRequests = requests.filter(time => now - time < window);
      
      if (validRequests.length === 0) {
        this.rateLimitMap.delete(key);
      } else {
        this.rateLimitMap.set(key, validRequests);
      }
    }
  }

  private async reviewActiveIncidents(): Promise<void> {
    for (const [key, incident] of this.activeIncidents.entries()) {
      // Auto-close incidents older than 24 hours with no new events
      const hoursSinceUpdate = (Date.now() - incident.updatedAt.getTime()) / 3600000;
      
      if (hoursSinceUpdate > 24 && incident.status === 'open') {
        incident.status = 'resolved';
        incident.resolvedAt = new Date();
        
        await this.supabase
          .from('security_incidents')
          .update(incident)
          .eq('id', incident.id);
        
        this.activeIncidents.delete(key);
      }
    }
  }

  private generateRecommendations(
    events: any[],
    incidents: any[]
  ): string[] {
    const recommendations = [];

    // Analyze event patterns
    const criticalCount = events?.filter(e => e.severity === 'critical').length || 0;
    if (criticalCount > 10) {
      recommendations.push('High number of critical events detected. Review security policies.');
    }

    const sqlInjectionCount = events?.filter(e => e.type === 'sql_injection').length || 0;
    if (sqlInjectionCount > 0) {
      recommendations.push('SQL injection attempts detected. Review input validation.');
    }

    const bruteForceCount = events?.filter(e => e.type === 'brute_force_attempt').length || 0;
    if (bruteForceCount > 5) {
      recommendations.push('Multiple brute force attempts. Consider implementing CAPTCHA.');
    }

    // Check unresolved incidents
    const unresolvedCount = incidents?.filter(i => i.status !== 'resolved').length || 0;
    if (unresolvedCount > 0) {
      recommendations.push(`${unresolvedCount} unresolved incidents require attention.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Security posture is healthy. Continue monitoring.');
    }

    return recommendations;
  }
}

export default SecurityMonitor;