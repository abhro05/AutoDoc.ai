// app.js
import express from "express";
import cookieParser from "cookie-parser";
import helmetMiddleware from "./config/helmet.js";
import { validateEnv } from "./config/helmet.js";
import logger from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";
import authRoutes from "./routes/auth.js";
import dotenv from "dotenv";
import corsMiddleware from "./config/cors.js";

dotenv.config();
validateEnv();

const app = express();

// ========== MIDDLEWARE ==========
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use(logger);

// ========== ROUTES ==========
app.use("/api/auth", authRoutes);
app.get("/", (req, res) => res.send("API is running..."));

// ========== 404 & ERROR HANDLER ==========
app.use(notFound);
app.use(errorHandler);

export default app;