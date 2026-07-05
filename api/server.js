// server.js
import dotenv from "dotenv";
import app from "./app.js"; 
import { initializeDatabase } from "./bootstrap/database.js";
import logger from "./utils/logger.js";
dotenv.config();

import cookieParser from "cookie-parser";

import helmetMiddleware from "./config/helmet.js";
import { validateEnv } from "./config/envValidator.js";

import authRoutes from "./routes/auth.js";
import { initializeDatabase } from "./bootstrap/database.js";

import authRoutes from "./routes/auth.js";
import { globalLimiter } from "./middleware/rateLimiter.js";

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

// Global Rate Limiter
app.use(globalLimiter);

app.use(express.json());
app.use(cookieParser());

// ========== ROUTES ==========
app.use("/api/auth", authRoutes);

// ========== TEST ROUTE ==========
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ========== 404 HANDLER ==========
app.use(notFound);

// ========== GLOBAL ERROR HANDLER ==========
app.use(errorHandler);

// ========== DATABASE ==========
initializeDatabase();
// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    logger.info("🚀 Initializing Database connection...");
    await initializeDatabase();

    const server = app.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
    });
    
    const shutdown = (signal) => {
      logger.info(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info("🔌 Server closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    return server;
  } catch (error) {
    logger.error("❌ Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer().catch((err) => {
  logger.error(`💥 Fatal error during startup: ${err.message}`);
  process.exit(1);
});