import express from "express";

import {
  register,
  login,
  supabaseLogin,
} from "../controllers/authController.js";

import { loginLimiter, registerLimiter } from "../middleware/rateLimiter.js";

import { catchAsync } from "../middleware/errorHandler.js";

const router = express.Router();

// ================= REGISTER =================
router.post("/register", registerLimiter, catchAsync(register));

// ================= LOGIN =================
router.post("/login", loginLimiter, catchAsync(login));

// ================= SUPABASE OAUTH =================
router.post("/supabase", catchAsync(supabaseLogin));

export default router;
