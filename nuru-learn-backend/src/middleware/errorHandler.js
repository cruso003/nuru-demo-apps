const logger = require('../utils/logger');
const config = require('../config');

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Default error response
  let status = 500;
  let message = 'Internal server error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    details = err.details || err.message;
  } else if (err.name === 'UnauthorizedError' || err.message.includes('jwt')) {
    status = 401;
    message = 'Authentication failed';
  } else if (err.code === 'PGRST116') {
    // Supabase table not found
    status = 404;
    message = 'Resource not found';
  } else if (err.code === 'PGRST301') {
    // Supabase RLS policy violation
    status = 403;
    message = 'Access denied';
  } else if (err.code === '23505') {
    // PostgreSQL unique constraint violation
    status = 409;
    message = 'Resource already exists';
  } else if (err.code === '23503') {
    // PostgreSQL foreign key constraint violation
    status = 400;
    message = 'Invalid reference';
  } else if (err.message.includes('rate limit')) {
    status = 429;
    message = 'Rate limit exceeded';
  } else if (err.message.includes('timeout')) {
    status = 408;
    message = 'Request timeout';
  }

  // Don't expose internal errors in production
  if (config.NODE_ENV === 'production' && status === 500) {
    message = 'Something went wrong. Please try again later.';
    details = null;
  } else if (config.NODE_ENV !== 'production') {
    details = err.stack;
  }

  // Send error response
  res.status(status).json({
    error: message,
    ...(details && { details }),
    timestamp: new Date().toISOString(),
    requestId: req.id || Math.random().toString(36).substr(2, 9)
  });
}

/**
 * 404 handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
}

/**
 * Async error wrapper
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
