import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmetMiddleware from './config/helmet.js';
dotenv.config();

const app = express();
import { validateEnv } from './config/envValidator.js';
validateEnv();

// ========== MIDDLEWARE ==========
app.use(helmetMiddleware);
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ========== HEALTH CHECK ENDPOINT ==========
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    server: {
      port: process.env.PORT || 5000,
      environment: process.env.NODE_ENV || 'development',
    },
    database: {
      status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      name: mongoose.connection.name || 'Not connected',
    },
    memory: {
      usage: process.memoryUsage(),
    },
  };

  if (mongoose.connection.readyState !== 1) {
    healthCheck.status = 'Degraded';
    return res.status(503).json(healthCheck);
  }

  res.status(200).json(healthCheck);
});

// ========== IMPORT ROUTES ==========
import authRoutes from './routes/auth.js';

// ========== USE ROUTES ==========
app.use('/api/auth', authRoutes);

// ========== TEST ROUTE ==========
app.get('/', (req, res) => {
  res.send('API is running...');
});

// ========== MONGODB CONNECTION ==========
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Error:', err));

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});