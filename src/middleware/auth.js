import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { logger } from '../services/logger.js';

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request object
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid authorization token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token exists in database (for logout functionality)
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session'
      });
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await prisma.userSession.delete({
        where: { id: session.id }
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Session expired'
      });
    }

    // Attach user to request object
    req.user = session.user;
    req.sessionId = session.id;
    
    // Update last login time
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastLoginAt: new Date() }
    });

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token provided
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: { user: true }
    });

    if (session && session.expiresAt > new Date()) {
      req.user = session.user;
      req.sessionId = session.id;
    }

    next();
  } catch (error) {
    // Silent fail for optional auth
    next();
  }
};

/**
 * Admin role middleware
 */
export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
  next();
};
