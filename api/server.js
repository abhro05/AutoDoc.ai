import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import helmetMiddleware from "./config/helmet.js";
import { validateEnv } from "./config/envValidator.js";

import logger from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";

import authRoutes from "./routes/auth.js";
import healthRoutes  from "./routes/health.js"
dotenv.config();

validateEnv();

const app = express();

// ========== MIDDLEWARE ==========
app.use(helmetMiddleware);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Centralized Request Logger
app.use(logger);

// ========== ROUTES ==========
app.use("/api/auth", authRoutes);
app.use("/health",healthRoutes)
// ========== TEST ROUTE ==========
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ========== 404 HANDLER ==========
app.use(notFound);

// ========== GLOBAL ERROR HANDLER ==========
app.use(errorHandler);

// ========== DATABASE ==========
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});