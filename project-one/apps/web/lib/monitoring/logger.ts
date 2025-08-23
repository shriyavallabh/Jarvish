/**
 * Structured Logger for JARVISH Platform
 * Provides structured logging with correlation IDs and audit trails
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}

// Log context interface
export interface LogContext {
  correlationId?: string;
  userId?: string;
  advisorId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

// Audit log entry
export interface AuditLogEntry {
  timestamp: string;
  correlationId: string;
  userId?: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const log = {
      timestamp,
      level,
      message,
      ...meta
    };
    return JSON.stringify(log);
  })
);

// Create Winston logger instance
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: {
    service: 'jarvish',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Error logs
  winstonLogger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5
  }));
  
  // Combined logs
  winstonLogger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 10485760, // 10MB
    maxFiles: 10
  }));
  
  // Audit logs
  winstonLogger.add(new winston.transports.File({
    filename: 'logs/audit.log',
    level: 'info',
    maxsize: 10485760, // 10MB
    maxFiles: 30
  }));
}

// Logger class with context support
class Logger {
  private context: LogContext = {};
  private correlationId: string;
  
  constructor(context?: LogContext) {
    this.correlationId = context?.correlationId || uuidv4();
    this.context = {
      ...context,
      correlationId: this.correlationId
    };
  }
  
  // Create child logger with additional context
  child(context: LogContext): Logger {
    return new Logger({
      ...this.context,
      ...context,
      correlationId: context.correlationId || this.correlationId
    });
  }
  
  // Set correlation ID
  setCorrelationId(correlationId: string) {
    this.correlationId = correlationId;
    this.context.correlationId = correlationId;
  }
  
  // Get correlation ID
  getCorrelationId(): string {
    return this.correlationId;
  }
  
  // Log methods
  error(message: string, error?: Error | any, metadata?: Record<string, any>) {
    winstonLogger.error(message, {
      ...this.context,
      ...metadata,
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: error.code,
        ...error
      } : undefined
    });
  }
  
  warn(message: string, metadata?: Record<string, any>) {
    winstonLogger.warn(message, {
      ...this.context,
      ...metadata
    });
  }
  
  info(message: string, metadata?: Record<string, any>) {
    winstonLogger.info(message, {
      ...this.context,
      ...metadata
    });
  }
  
  http(message: string, metadata?: Record<string, any>) {
    winstonLogger.http(message, {
      ...this.context,
      ...metadata
    });
  }
  
  debug(message: string, metadata?: Record<string, any>) {
    winstonLogger.debug(message, {
      ...this.context,
      ...metadata
    });
  }
  
  // Audit logging
  audit(entry: Omit<AuditLogEntry, 'timestamp' | 'correlationId'>) {
    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId
    };
    
    winstonLogger.info('AUDIT', {
      ...this.context,
      audit: auditEntry
    });
  }
  
  // Performance logging
  performance(operation: string, duration: number, metadata?: Record<string, any>) {
    winstonLogger.info('PERFORMANCE', {
      ...this.context,
      performance: {
        operation,
        duration,
        ...metadata
      }
    });
  }
  
  // API request logging
  apiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    metadata?: Record<string, any>
  ) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    winstonLogger.log(level, 'API_REQUEST', {
      ...this.context,
      api: {
        method,
        path,
        statusCode,
        duration,
        ...metadata
      }
    });
  }
  
  // Database query logging
  dbQuery(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    const level = success ? 'debug' : 'error';
    
    winstonLogger.log(level, 'DB_QUERY', {
      ...this.context,
      database: {
        operation,
        table,
        duration,
        success,
        ...metadata
      }
    });
  }
  
  // WhatsApp message logging
  whatsappMessage(
    action: 'send' | 'receive' | 'delivered' | 'failed',
    phoneNumber: string,
    metadata?: Record<string, any>
  ) {
    const level = action === 'failed' ? 'error' : 'info';
    
    winstonLogger.log(level, 'WHATSAPP', {
      ...this.context,
      whatsapp: {
        action,
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        ...metadata
      }
    });
  }
  
  // Content generation logging
  contentGeneration(
    action: 'start' | 'complete' | 'failed',
    contentType: string,
    metadata?: Record<string, any>
  ) {
    const level = action === 'failed' ? 'error' : 'info';
    
    winstonLogger.log(level, 'CONTENT_GENERATION', {
      ...this.context,
      content: {
        action,
        contentType,
        ...metadata
      }
    });
  }
  
  // Compliance logging
  compliance(
    checkType: string,
    result: 'pass' | 'fail' | 'warning',
    metadata?: Record<string, any>
  ) {
    const level = result === 'fail' ? 'error' : result === 'warning' ? 'warn' : 'info';
    
    winstonLogger.log(level, 'COMPLIANCE', {
      ...this.context,
      compliance: {
        checkType,
        result,
        ...metadata
      }
    });
  }
  
  // Security event logging
  security(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, any>
  ) {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    
    winstonLogger.log(level, 'SECURITY', {
      ...this.context,
      security: {
        event,
        severity,
        ...metadata
      }
    });
  }
  
  // Helper method to mask sensitive data
  private maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 4) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(-4);
  }
}

// Export singleton logger instance
const logger = new Logger();

// Export Logger class for creating child loggers
export { Logger };

// Export default logger instance
export default logger;

// Middleware for Express/Next.js API routes
export const loggingMiddleware = (req: any, res: any, next: any) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  const requestLogger = new Logger({
    correlationId,
    requestId: uuidv4(),
    userId: req.user?.id,
    component: 'api'
  });
  
  // Attach logger to request
  req.logger = requestLogger;
  
  // Log request
  const startTime = Date.now();
  requestLogger.http(`${req.method} ${req.path}`, {
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'x-forwarded-for': req.headers['x-forwarded-for']
    }
  });
  
  // Log response
  const originalSend = res.send;
  res.send = function(data: any) {
    const duration = Date.now() - startTime;
    requestLogger.apiRequest(
      req.method,
      req.path,
      res.statusCode,
      duration,
      {
        responseSize: data ? data.length : 0
      }
    );
    originalSend.call(this, data);
  };
  
  next();
};

// Helper function for structured error logging
export const logError = (
  error: Error,
  context?: LogContext,
  metadata?: Record<string, any>
) => {
  const errorLogger = context ? new Logger(context) : logger;
  errorLogger.error(error.message, error, metadata);
};

// Helper function for audit logging
export const logAudit = (
  action: string,
  resource: string,
  result: 'success' | 'failure',
  context?: LogContext,
  details?: Record<string, any>
) => {
  const auditLogger = context ? new Logger(context) : logger;
  auditLogger.audit({
    action,
    resource,
    result,
    details,
    userId: context?.userId
  });
};