import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface JWTPayload {
  id: string;
  email: string;
  tier: string;
  iat?: number;
  exp?: number;
}

interface AuthRequest extends Request {
  user?: JWTPayload;
  token?: string;
}

// Verify JWT Token
export const authenticateToken = async (
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
        const advisor = await prisma.advisor.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            tier: true,
            isActive: true,
            isVerified: true,
          },
        });

        if (!advisor || !advisor.isActive) {
          return res.status(401).json({
            error: 'Account inactive',
            message: 'Your account is no longer active',
          });
        }

        // Attach user to request
        req.user = {
          id: advisor.id,
          email: advisor.email,
          tier: advisor.tier,
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

// Check if user has required tier
export const requireTier = (allowedTiers: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate to access this resource',
      });
    }

    if (!allowedTiers.includes(req.user.tier)) {
      return res.status(403).json({
        error: 'Insufficient privileges',
        message: `This feature requires ${allowedTiers.join(' or ')} tier`,
        currentTier: req.user.tier,
      });
    }

    next();
  };
};

// Rate limiting based on tier
export const tierBasedRateLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next();
  }

  const limits: Record<string, number> = {
    BASIC: 100,
    STANDARD: 300,
    PRO: 1000,
    ENTERPRISE: 5000,
  };

  const userLimit = limits[req.user.tier] || 100;
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

    // Hash the API key to compare with stored hash
    const crypto = require('crypto');
    const hashedKey = crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');

    const keyRecord = await prisma.apiKey.findUnique({
      where: { hashedKey },
      include: {
        advisor: {
          select: {
            id: true,
            email: true,
            tier: true,
            isActive: true,
          },
        },
      },
    });

    if (!keyRecord || !keyRecord.isActive) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid or inactive',
      });
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return res.status(401).json({
        error: 'API key expired',
        message: 'This API key has expired',
      });
    }

    if (!keyRecord.advisor.isActive) {
      return res.status(401).json({
        error: 'Account inactive',
        message: 'The account associated with this API key is inactive',
      });
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: {
        lastUsedAt: new Date(),
        useCount: { increment: 1 },
      },
    });

    // Attach user to request
    (req as AuthRequest).user = {
      id: keyRecord.advisor.id,
      email: keyRecord.advisor.email,
      tier: keyRecord.advisor.tier,
    };

    next();
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
    
    const advisor = await prisma.advisor.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        tier: true,
        isActive: true,
      },
    });

    if (advisor && advisor.isActive) {
      req.user = {
        id: advisor.id,
        email: advisor.email,
        tier: advisor.tier,
      };
    }
  } catch (error) {
    // Ignore errors for optional auth
  }

  next();
};

export default {
  authenticateToken,
  requireTier,
  tierBasedRateLimit,
  authenticateApiKey,
  optionalAuth,
};