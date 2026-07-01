import rateLimit from "express-rate-limit";

// ================= RATE LIMITERS =================

// General rate limiter for all routes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    success: false,
    error: {
      message: "Too many requests, please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
      status: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: {
      message: "Too many login attempts. Please try again after 15 minutes.",
      code: "LOGIN_RATE_LIMIT_EXCEEDED",
      status: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: {
      message: "Too many accounts created. Please try again later.",
      code: "REGISTER_RATE_LIMIT_EXCEEDED",
      status: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: {
    success: false,
    error: {
      message: "Too many reset requests. Please try again after 15 minutes.",
      code: "FORGOT_PASSWORD_RATE_LIMIT_EXCEEDED",
      status: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: {
      message: "Too many reset attempts. Please try again after 15 minutes.",
      code: "RESET_PASSWORD_RATE_LIMIT_EXCEEDED",
      status: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Environment variable based configuration
export const createLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: options.max || parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: options.message || {
      success: false,
      error: {
        message: "Too many requests, please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
        status: 429
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return process.env.NODE_ENV === 'development';
    }
  });
};