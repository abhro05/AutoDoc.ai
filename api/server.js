// server.js
import dotenv from "dotenv";
import app from "./app.js"; // 🟢 यहाँ नई app.js को इम्पोर्ट करें
import { initializeDatabase } from "./bootstrap/database.js";

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
    console.log("🚀 Initializing Database connection...");
    await initializeDatabase(); // डेटाबेस कनेक्ट करें

    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

    // Graceful Shutdown (Ctrl+C दबाने पर सुरक्षित बंद होना)
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