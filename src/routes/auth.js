import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import Joi from 'joi';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../services/logger.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(50).required(),
  age: Joi.number().integer().min(18).max(120).optional(),
  personalityType: Joi.string().valid('introvert', 'extrovert', 'ambivert').optional(),
  anxietyLevel: Joi.number().integer().min(1).max(10).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const profileUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  age: Joi.number().integer().min(18).max(120).optional(),
  personalityType: Joi.string().valid('introvert', 'extrovert', 'ambivert').optional(),
  anxietyLevel: Joi.number().integer().min(1).max(10).optional()
});

// Helper function to generate JWT token and create session
const createSession = async (userId) => {
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

  const session = await prisma.userSession.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });

  return { token, session };
};

/**
 * POST /api/auth/register
 * Register new user with email and password
 */
router.post('/register', asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(detail => detail.message)
    });
  }

  const { email, password, name, age, personalityType, anxietyLevel } = value;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'User with this email already exists'
    });
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create new user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      age,
      personalityType,
      anxietyLevel,
      provider: 'email'
    },
    select: {
      id: true,
      email: true,
      name: true,
      age: true,
      personalityType: true,
      anxietyLevel: true,
      createdAt: true
    }
  });

  // Create session
  const { token } = await createSession(user.id);

  logger.info(`New user registered: ${email}`);

  res.status(201).json({
    message: 'User registered successfully',
    user,
    token
  });
}));

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(detail => detail.message)
    });
  }

  const { email, password } = value;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !user.passwordHash) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid email or password'
    });
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid email or password'
    });
  }

  // Create session
  const { token } = await createSession(user.id);

  logger.info(`User logged in: ${email}`);

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      age: user.age,
      personalityType: user.personalityType,
      anxietyLevel: user.anxietyLevel
    },
    token
  });
}));

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  // Delete current session
  await prisma.userSession.delete({
    where: { id: req.sessionId }
  });

  logger.info(`User logged out: ${req.user.email}`);

  res.json({
    message: 'Logout successful'
  });
}));

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      age: true,
      personalityType: true,
      anxietyLevel: true,
      provider: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  res.json({ user });
}));

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authMiddleware, asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = profileUpdateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(detail => detail.message)
    });
  }

  // Update user profile
  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: value,
    select: {
      id: true,
      email: true,
      name: true,
      age: true,
      personalityType: true,
      anxietyLevel: true,
      updatedAt: true
    }
  });

  logger.info(`User profile updated: ${req.user.email}`);

  res.json({
    message: 'Profile updated successfully',
    user: updatedUser
  });
}));

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', authMiddleware, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'New password must be at least 6 characters long'
    });
  }

  // Get user with password hash
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  if (!user.passwordHash) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Cannot change password for social login accounts'
    });
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Current password is incorrect'
    });
  }

  // Hash new password
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash: newPasswordHash }
  });

  // Invalidate all other sessions
  await prisma.userSession.deleteMany({
    where: {
      userId: req.user.id,
      id: { not: req.sessionId }
    }
  });

  logger.info(`Password changed for user: ${req.user.email}`);

  res.json({
    message: 'Password changed successfully'
  });
}));

/**
 * GET /api/auth/google
 * Initiate Google OAuth login
 */
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  asyncHandler(async (req, res) => {
    const { token } = await createSession(req.user.id);
    
    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;
    res.redirect(redirectUrl);
  })
);

export default router;
