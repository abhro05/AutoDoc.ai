// src/bootstrap/database.js
import mongoose from "mongoose";

export const initializeDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // अगर कनेक्शन फेल होता है, तो सर्वर बंद कर दें
  }
};