// controllers/healthController.js
import mongoose from "mongoose";

export const healthCheck = (req, res) => {
  const memoryUsage = process.memoryUsage();
  const dbState = mongoose.connection.readyState;

  const dbStatusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const dbStatus = dbStatusMap[dbState] || "unknown";

  return res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + " MB",
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + " MB",
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + " MB",
    },
    environment: process.env.NODE_ENV || "development",
    mongodb: dbStatus,
  });
};