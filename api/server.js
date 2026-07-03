// server.js
import dotenv from "dotenv";
import app from "./app.js"; // 🟢 यहाँ नई app.js को इम्पोर्ट करें
import { initializeDatabase } from "./bootstrap/database.js";
import logger from "./utils/logger.js";
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    logger.info("🚀 Initializing Database connection...");
    await initializeDatabase(); // डेटाबेस कनेक्ट करें

    const server = app.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
    });

    // Graceful Shutdown (Ctrl+C दबाने पर सुरक्षित बंद होना)
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