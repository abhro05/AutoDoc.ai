// server.js
import dotenv from "dotenv";
import app from "./app.js"; 
import { initializeDatabase } from "./bootstrap/database.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("🚀 Initializing Database connection...");
    await initializeDatabase(); 

    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  
    const shutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log("🔌 Server closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    return server;
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer().catch((err) => {
  console.error(`💥 Fatal error during startup: ${err.message}`);
  process.exit(1);
});