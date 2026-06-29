import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getRegisterValidationMessage } from "../utils/authValidation.js";
import { getSupabaseAdmin } from "../utils/supabaseAdmin.js";
import { normalizeEmail } from "../utils/normalizeEmail.js";

// ========== REGISTER ==========
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const validationMessage = getRegisterValidationMessage({ name, email, password });

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    if (!process.env.JWT_SECRET) {
      console.error("Register error: JWT_SECRET is not configured");
      return res.status(500).json({ message: "Unable to create an account right now." });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists. Please sign in instead." });
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
  } catch (error) {
    console.error("Register error:", error);

    if (error?.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists. Please sign in instead." });
    }

    res.status(500).json({ message: "Unable to create an account right now." });
  }
}
// ========== LOGIN ==========
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
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
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// ========== SUPABASE OAUTH ==========
export const supabaseLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: "Access token is required" });
    }

    const supabase = getSupabaseAdmin();
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(accessToken);

    if (error || !supabaseUser) {
      return res.status(401).json({ message: "Invalid or expired access token" });
    }

    const normalizedEmail = normalizeEmail(supabaseUser?.email);
    const email = normalizedEmail;
    const userMeta = supabaseUser.user_metadata || {};
    const provider = supabaseUser.app_metadata?.provider || 'email';
    const name = userMeta.full_name || userMeta.name || email?.split('@')[0] || 'User';
    const avatarUrl = userMeta.avatar_url || userMeta.picture || null;

    let user = await User.findOne({
      $or: [
        { supabaseId: supabaseUser.id },
        { email: normalizedEmail },
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
        email: normalizedEmail,
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
  } catch (error) {
    console.error("Supabase auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
};