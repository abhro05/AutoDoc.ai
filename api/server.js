import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import helmetMiddleware from "./config/helmet.js";
import { validateEnv } from "./config/envValidator.js";

import authRoutes from "./routes/auth.js";
import healthRoutes  from "./routes/health.js"
import { globalLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";

dotenv.config();

// ================= VALIDATE ENVIRONMENT =================
validateEnv();

const app = express();

// ================= MIDDLEWARE =================
app.use(helmetMiddleware);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/health",healthRoutes)
// ========== TEST ROUTE ==========
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ================= 404 HANDLER =================
app.use(notFound);

// ================= GLOBAL ERROR HANDLER =================
app.use(errorHandler);

// ================= MONGODB CONNECTION =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});