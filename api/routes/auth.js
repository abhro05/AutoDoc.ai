import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import nodemailer from "nodemailer"; 
import User from "../models/User.js";
import { getRegisterValidationMessage } from "../utils/authValidation.js";
import { getSupabaseAdmin } from "../utils/supabaseAdmin.js";
import { loginLimiter, registerLimiter, forgotPasswordLimiter, resetPasswordLimiter } from "../middleware/rateLimiter.js";
import { register, login, supabaseLogin } from "../controllers/authController.js";
import { catchAsync } from "../middleware/errorHandler.js";

const router = express.Router();

// ========== REGISTER ==========
router.post("/register", registerLimiter, catchAsync(register));

// ========== LOGIN ==========
router.post("/login", loginLimiter, catchAsync(login));

// ========== SUPABASE OAUTH ==========
router.post("/supabase", loginLimiter, catchAsync(supabaseLogin));

export default router;