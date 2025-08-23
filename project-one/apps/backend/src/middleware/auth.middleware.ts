import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import crypto from 'crypto';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

interface AuthRequest extends Request {
  user?: JWTPayload;
  token?: string;
}

// Verify JWT Token
export const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authentication token',
      });
    }

    // Check if token is blacklisted (for logout functionality)
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        error: 'Token invalidated',
        message: 'This token has been revoked',
      });
    }

    // Verify token
    jwt.verify(
      token,
      process.env.JWT_SECRET as string,
      async (err: any, decoded: any) => {
        if (err) {
          if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
              error: 'Token expired',
              message: 'Your session has expired. Please login again',
            });
          }
          return res.status(403).json({
            error: 'Invalid token',
            message: 'The provided token is invalid',
          });
        }

        const user = decoded as JWTPayload;

        // Verify user still exists and is active
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            isVerified: true,
          },
        });

        if (!dbUser || !dbUser.isActive) {
          return res.status(401).json({
            error: 'Account inactive',
            message: 'Your account is no longer active',
          });
        }

        // Attach user to request
        req.user = {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
        };
        req.token = token;

        next();
      }
    );
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication',
    });
  }
};

// Require admin role
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please authenticate to access this resource',
    });
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Insufficient privileges',
      message: 'Admin access required',
      currentRole: req.user.role,
    });
  }

  next();
};

// Require super admin role
export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please authenticate to access this resource',
    });
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Insufficient privileges',
      message: 'Super admin access required',
      currentRole: req.user.role,
    });
  }

  next();
};

// Check subscription status for subscribers
export const requireActiveSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please authenticate to access this resource',
    });
  }

  if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
    return next(); // Admins don't need subscriptions
  }

  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId: req.user.id,
      status: { in: ['ACTIVE', 'TRIALING'] },
      expiresAt: { gte: new Date() },
    },
  });

  if (!activeSubscription) {
    return res.status(403).json({
      error: 'No active subscription',
      message: 'Please subscribe to access this feature',
    });
  }

  next();
};

// Rate limiting based on subscription plan
export const planBasedRateLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next();
  }

  // Admins have no rate limits
  if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  // Get user's subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: req.user.id,
      status: 'ACTIVE',
    },
  });

  const limits: Record<string, number> = {
    BASIC_499: 100,
    STANDARD_999: 300,
    PREMIUM_1999: 1000,
    ENTERPRISE_CUSTOM: 5000,
  };

  const userLimit = subscription ? (limits[subscription.planType] || 100) : 50; // 50 for free users
  const key = `rate:${req.user.id}:${Math.floor(Date.now() / 60000)}`; // Per minute

  try {
    const current = await redis.incr(key);
    await redis.expire(key, 60); // Expire after 1 minute

    res.setHeader('X-RateLimit-Limit', userLimit.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, userLimit - current).toString());

    if (current > userLimit) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later',
        retryAfter: 60,
      });
    }

    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    next(); // Continue on error
  }
};

// Verify API Key for external access
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'Please provide a valid API key',
      });
    }

    // Note: API key functionality has been removed from the new schema
    // This is kept for backwards compatibility but will need to be reimplemented
    // if API key access is required

    return res.status(501).json({
      error: 'API key authentication not implemented',
      message: 'Please use JWT authentication',
    });

  } catch (error) {
    console.error('API key auth error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during API key authentication',
    });
  }
};

// Optional authentication (for public endpoints that may have enhanced features for authenticated users)
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continue without authentication
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    }
  } catch (error) {
    // Ignore errors for optional auth
  }

  next();
};

// Backwards compatibility exports
export const authenticateToken = authenticateJWT;
export const requireTier = requireActiveSubscription;
export const tierBasedRateLimit = planBasedRateLimit;

export default {
  authenticateJWT,
  authenticateToken,
  requireAdmin,
  requireSuperAdmin,
  requireActiveSubscription,
  requireTier,
  planBasedRateLimit,
  tierBasedRateLimit,
  authenticateApiKey,
  optionalAuth,
};