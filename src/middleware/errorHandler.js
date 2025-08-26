import { logger } from '../services/logger.js';

/**
 * Global Error Handler Middleware
 * Catches all errors and returns appropriate responses
 */
export const errorHandler = (error, req, res, next) => {
  logger.error('Error caught by error handler:', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = error.details || error.message;
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
    details = 'A record with this value already exists';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma errors
    if (error.code === 'P2002') {
      statusCode = 409;
      message = 'Unique constraint violation';
      details = `Duplicate value for field: ${error.meta?.target?.join(', ')}`;
    } else if (error.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    } else if (error.code === 'P2003') {
      statusCode = 400;
      message = 'Foreign key constraint violation';
    }
  } else if (error.status) {
    statusCode = error.status;
    message = error.message || message;
  }

  // Don't leak error details in production
  const response = {
    error: message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add details in development mode
  if (process.env.NODE_ENV === 'development') {
    response.details = details || error.message;
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
};
