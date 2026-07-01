import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getRegisterValidationMessage } from "../utils/authValidation.js";
import { getSupabaseAdmin } from "../utils/supabaseAdmin.js";
import { AppError } from "../middleware/errorHandler.js";

// ========== REGISTER ==========
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  
  const validationMessage = getRegisterValidationMessage({ name, email, password });
  if (validationMessage) {
    throw new AppError(validationMessage, 400, 'VALIDATION_ERROR');
  }

  if (!process.env.JWT_SECRET) {
    console.error("Register error: JWT_SECRET is not configured");
    throw new AppError("Unable to create an account right now.", 500, 'CONFIG_ERROR');
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError(
      "An account with this email already exists. Please sign in instead.",
      409,
      'USER_EXISTS'
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
  });

  const token = jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(201).json({
    success: true,
    message: "User created successfully",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};

// ========== LOGIN ==========
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required", 400, 'MISSING_FIELDS');
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.password) {
    throw new AppError("Invalid credentials", 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 401, 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};

// ========== SUPABASE OAUTH ==========
export const supabaseLogin = async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    throw new AppError("Access token is required", 400, 'MISSING_TOKEN');
  }

  const supabase = getSupabaseAdmin();
  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(accessToken);

  if (error || !supabaseUser) {
    throw new AppError("Invalid or expired access token", 401, 'INVALID_TOKEN');
  }

  const email = supabaseUser.email;
  const userMeta = supabaseUser.user_metadata || {};
  const provider = supabaseUser.app_metadata?.provider || 'email';
  const name = userMeta.full_name || userMeta.name || email?.split('@')[0] || 'User';
  const avatarUrl = userMeta.avatar_url || userMeta.picture || null;

  let user = await User.findOne({
    $or: [
      { supabaseId: supabaseUser.id },
      { email: email?.toLowerCase() },
    ],
  });

  if (user) {
    if (!user.supabaseId) user.supabaseId = supabaseUser.id;
    if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl;
    user.authProvider = provider;
    if (!user.name || user.name === email?.split('@')[0]) {
      user.name = name;
    }
  } else {
    user = new User({
      name,
      email: email?.toLowerCase(),
      password: null,
      supabaseId: supabaseUser.id,
      avatarUrl,
      authProvider: provider,
    });
  }

  await user.save();

  const token = jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    success: true,
    message: "Authentication successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      authProvider: user.authProvider,
    },
  });
};