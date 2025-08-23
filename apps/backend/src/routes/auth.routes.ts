import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validate, schemas } from '../middleware/validation.middleware';
import { authenticateToken } from '../middleware/auth.middleware';
import Redis from 'ioredis';

const router = Router();
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Generate JWT tokens
const generateTokens = (advisor: any) => {
  const accessToken = jwt.sign(
    {
      id: advisor.id,
      email: advisor.email,
      tier: advisor.tier,
    },
    process.env.JWT_SECRET || 'default_secret',
    { 
      expiresIn: process.env.JWT_EXPIRE || '7d' 
    }
  );

  const refreshToken = jwt.sign(
    {
      id: advisor.id,
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' 
    }
  );

  return { accessToken, refreshToken };
};

// Register new advisor
router.post('/register', validate(schemas.register), async (req: Request, res: Response) => {
  try {
    const { email, password, name, companyName, arnNumber, phoneNumber, languagePrefs } = req.body;

    // Check if advisor already exists
    const existingAdvisor = await prisma.advisor.findFirst({
      where: {
        OR: [
          { email },
          ...(arnNumber ? [{ arnNumber }] : []),
          ...(phoneNumber ? [{ phoneNumber }] : []),
        ],
      },
    });

    if (existingAdvisor) {
      let field = 'Email';
      if (existingAdvisor.email === email) field = 'Email';
      else if (existingAdvisor.arnNumber === arnNumber) field = 'ARN number';
      else if (existingAdvisor.phoneNumber === phoneNumber) field = 'Phone number';

      return res.status(409).json({
        error: 'Registration failed',
        message: `${field} is already registered`,
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '10'));

    // Create advisor
    const advisor = await prisma.advisor.create({
      data: {
        email,
        passwordHash,
        name,
        companyName,
        arnNumber,
        phoneNumber,
        languagePrefs: languagePrefs || ['EN'],
        tier: 'BASIC',
      },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(advisor);

    // Store refresh token in database
    await prisma.session.create({
      data: {
        advisorId: advisor.id,
        token: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Log analytics event
    await prisma.analytics.create({
      data: {
        advisorId: advisor.id,
        eventType: 'LOGIN',
        eventName: 'advisor_registered',
        eventData: {
          method: 'email',
          tier: 'BASIC',
        },
      },
    });

    res.status(201).json({
      message: 'Registration successful',
      advisor: {
        id: advisor.id,
        email: advisor.email,
        name: advisor.name,
        tier: advisor.tier,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration',
    });
  }
});

// Login
router.post('/login', validate(schemas.login), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find advisor
    const advisor = await prisma.advisor.findUnique({
      where: { email },
    });

    if (!advisor) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, advisor.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
      });
    }

    // Check if account is active
    if (!advisor.isActive) {
      return res.status(403).json({
        error: 'Account inactive',
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(advisor);

    // Store session
    await prisma.session.create({
      data: {
        advisorId: advisor.id,
        token: accessToken,
        refreshToken,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Update login info
    await prisma.advisor.update({
      where: { id: advisor.id },
      data: {
        lastLogin: new Date(),
        loginCount: { increment: 1 },
      },
    });

    // Log analytics
    await prisma.analytics.create({
      data: {
        advisorId: advisor.id,
        eventType: 'LOGIN',
        eventName: 'advisor_login',
        eventData: {
          method: 'email',
          ipAddress: req.ip,
        },
      },
    });

    res.json({
      message: 'Login successful',
      advisor: {
        id: advisor.id,
        email: advisor.email,
        name: advisor.name,
        tier: advisor.tier,
        isVerified: advisor.isVerified,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login',
    });
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        message: 'Please provide a refresh token',
      });
    }

    // Verify refresh token
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
      async (err: any, decoded: any) => {
        if (err) {
          return res.status(403).json({
            error: 'Invalid refresh token',
            message: 'The refresh token is invalid or expired',
          });
        }

        // Find session
        const session = await prisma.session.findFirst({
          where: {
            refreshToken,
            isValid: true,
          },
          include: {
            advisor: true,
          },
        });

        if (!session) {
          return res.status(403).json({
            error: 'Session not found',
            message: 'Invalid refresh token',
          });
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(session.advisor);

        // Update session
        await prisma.session.update({
          where: { id: session.id },
          data: {
            token: accessToken,
            refreshToken: newRefreshToken,
            lastActivity: new Date(),
          },
        });

        res.json({
          tokens: {
            accessToken,
            refreshToken: newRefreshToken,
          },
        });
      }
    );
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing the token',
    });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req: any, res: Response) => {
  try {
    const token = req.token;
    const advisorId = req.user.id;

    // Invalidate session
    await prisma.session.updateMany({
      where: {
        advisorId,
        token,
      },
      data: {
        isValid: false,
      },
    });

    // Add token to blacklist (expires after token expiry)
    await redis.setex(`blacklist:${token}`, 7 * 24 * 60 * 60, '1'); // 7 days

    // Log analytics
    await prisma.analytics.create({
      data: {
        advisorId,
        eventType: 'LOGOUT',
        eventName: 'advisor_logout',
        eventData: {},
      },
    });

    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout',
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: any, res: Response) => {
  try {
    const advisor = await prisma.advisor.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        arnNumber: true,
        phoneNumber: true,
        whatsappNumber: true,
        languagePrefs: true,
        timezone: true,
        tier: true,
        isVerified: true,
        emailVerified: true,
        whatsappVerified: true,
        complianceScore: true,
        riskLevel: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: {
            contents: true,
            templates: true,
          },
        },
      },
    });

    if (!advisor) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'Advisor profile not found',
      });
    }

    // Get current subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        advisorId: req.user.id,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      advisor,
      subscription,
      stats: {
        totalContents: advisor._count.contents,
        totalTemplates: advisor._count.templates,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Profile fetch failed',
      message: 'An error occurred while fetching the profile',
    });
  }
});

// Update profile
router.patch('/profile', authenticateToken, async (req: any, res: Response) => {
  try {
    const allowedUpdates = [
      'name',
      'companyName',
      'phoneNumber',
      'whatsappNumber',
      'languagePrefs',
      'timezone',
    ];

    const updates: any = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const advisor = await prisma.advisor.update({
      where: { id: req.user.id },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        phoneNumber: true,
        whatsappNumber: true,
        languagePrefs: true,
        timezone: true,
        updatedAt: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        advisorId: req.user.id,
        action: 'UPDATE',
        entity: 'advisor',
        entityId: req.user.id,
        newValues: updates,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({
      message: 'Profile updated successfully',
      advisor,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Profile update failed',
      message: 'An error occurred while updating the profile',
    });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'New password must be at least 8 characters long',
      });
    }

    // Get advisor
    const advisor = await prisma.advisor.findUnique({
      where: { id: req.user.id },
    });

    if (!advisor) {
      return res.status(404).json({
        error: 'Advisor not found',
        message: 'Advisor not found',
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, advisor.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid password',
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '10'));

    // Update password
    await prisma.advisor.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all sessions
    await prisma.session.updateMany({
      where: { advisorId: req.user.id },
      data: { isValid: false },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        advisorId: req.user.id,
        action: 'PASSWORD_CHANGE',
        entity: 'advisor',
        entityId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({
      message: 'Password changed successfully. Please login again.',
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      error: 'Password change failed',
      message: 'An error occurred while changing the password',
    });
  }
});

export default router;