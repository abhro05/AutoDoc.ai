// server.js
import dotenv from "dotenv";
import app from "./app.js"; // 🟢 यहाँ नई app.js को इम्पोर्ट करें
import { initializeDatabase } from "./bootstrap/database.js";
import logger from "./utils/logger.js";
import mongoose from "mongoose";
dotenv.config();

import cookieParser from "cookie-parser";

import helmetMiddleware from "./config/helmet.js";
import { validateEnv } from "./config/envValidator.js";
import { errorHandler } from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";

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

// ========== MONGODB CONNECTION ==========
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    logger.info("🚀 Initializing Database connection...");
    await initializeDatabase(); // डेटाबेस कनेक्ट करें

    const server = app.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
    });

    // ==================== GRACEFUL SHUTDOWN  ====================
    const gracefulShutdown = (signal) => {
      logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);

      // 1. Timeout protection: Force exit if shutdown takes too long (10 seconds)
      const shutdownTimeout = setTimeout(() => {
        logger.error("⚠️ Shutdown timeout. Forcefully exiting...");
        process.exit(1);
      }, 10000);

      // 2. Stop accepting new requests
      server.close(() => {
        logger.info("🔌 HTTP server closed.");
        clearTimeout(shutdownTimeout); // Clear the timeout if successful

        // 3. Close MongoDB connection properly
        mongoose.connection.close().then(() => {
          logger.info("🔌 MongoDB connection closed.");
          logger.info("👋 Server shut down gracefully.");
          process.exit(0);
        }).catch((err) => {
          logger.error({ err }, "❌ Error closing MongoDB connection");
          process.exit(1);
        });
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