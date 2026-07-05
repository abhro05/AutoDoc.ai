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
import registerMiddlewares from "./middleware/index.js";

dotenv.config();
validateEnv();

const app = express();

//  ========== REGISTER ALL MIDDLEWARES ==========
registerMiddlewares(app)


// ========== ROUTES ==========
app.use("/api/auth", authRoutes);
app.get("/", (req, res) => res.send("API is running..."));

// ========== 404 & ERROR HANDLER ==========
app.use(notFound);
app.use(errorHandler);

export default app;