// src/bootstrap/database.js
import mongoose from "mongoose";
import logger from '../utils/logger.js';

export const initializeDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("✅ MongoDB Connected successfully");
  } catch (err) {
    logger.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  }
};