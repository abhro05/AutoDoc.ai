import rateLimit from "express-rate-limit";

// ================= ENV CONFIG =================
const LOGIN_WINDOW_MS =
  Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) ||
  15 * 60 * 1000;

const LOGIN_MAX_REQUESTS =
  Number(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS) ||
  5;

const REGISTER_WINDOW_MS =
  Number(process.env.REGISTER_RATE_LIMIT_WINDOW_MS) ||
  60 * 60 * 1000;

const REGISTER_MAX_REQUESTS =
  Number(process.env.REGISTER_RATE_LIMIT_MAX_REQUESTS) ||
  10;

const FORGOT_PASSWORD_WINDOW_MS =
  Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS) ||
  15 * 60 * 1000;

const FORGOT_PASSWORD_MAX_REQUESTS =
  Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX_REQUESTS) ||
  3;

const RESET_PASSWORD_WINDOW_MS =
  Number(process.env.RESET_PASSWORD_RATE_LIMIT_WINDOW_MS) ||
  15 * 60 * 1000;

const RESET_PASSWORD_MAX_REQUESTS =
  Number(process.env.RESET_PASSWORD_RATE_LIMIT_MAX_REQUESTS) ||
  5;

// ================= LOGIN RATE LIMITER =================
export const loginLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  max: LOGIN_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

// ================= REGISTER RATE LIMITER =================
export const registerLimiter = rateLimit({
  windowMs: REGISTER_WINDOW_MS,
  max: REGISTER_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many accounts created. Please try again later.",
  },
});

// ================= FORGOT PASSWORD RATE LIMITER =================
export const forgotPasswordLimiter = rateLimit({
  windowMs: FORGOT_PASSWORD_WINDOW_MS,
  max: FORGOT_PASSWORD_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password reset requests. Please try again later.",
  },
});

// ================= RESET PASSWORD RATE LIMITER =================
export const resetPasswordLimiter = rateLimit({
  windowMs: RESET_PASSWORD_WINDOW_MS,
  max: RESET_PASSWORD_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password reset attempts. Please try again later.",
  },
});


export const globalLimiter = rateLimit({
  windowMs:
    Number(process.env.RATE_LIMIT_WINDOW_MS) ||
    15 * 60 * 1000,

  max:
    Number(process.env.RATE_LIMIT_MAX_REQUESTS) ||
    100,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});