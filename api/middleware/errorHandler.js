// middleware/errorHandler.js

import logger from "../utils/logger.js";

/**
 * Custom error class for API errors
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle MongoDB errors
 */
const handleMongoError = (err) => {
  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `Duplicate value for ${field}. Please use a different value.`;
    return new AppError(message, 409, 'DUPLICATE_KEY');
  }

  // Cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400, 'INVALID_ID');
  }

  // Validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    const message = `Validation error: ${errors.join(', ')}`;
    return new AppError(message, 400, 'VALIDATION_ERROR');
  }

  return err;
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  logger.error('Error occurred:', {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  // Handle MongoDB errors
  let error = err;
  if (err.name === 'CastError' || err.name === 'ValidationError' || err.code === 11000) {
    error = handleMongoError(err);
  }

  // Default values
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errorCode = error.errorCode || 'INTERNAL_ERROR';

  // Response object
  const response = {
    success: false,
    error: {
      message: message,
      code: errorCode,
      status: statusCode,
    },
  };

  // Add validation details if available
  if (error.name === 'ValidationError' && error.errors) {
    response.error.details = Object.values(error.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Add stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Async wrapper to catch errors in route handlers
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export {
  AppError,
  errorHandler,
  catchAsync,
};