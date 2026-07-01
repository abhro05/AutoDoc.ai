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

// ========== REQUEST LOGGING MIDDLEWARE ==========
import requestLogger from './middleware/logger.js';
app.use(requestLogger);

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

// ========== ERROR HANDLING MIDDLEWARE ==========
// Import error handlers
import { errorHandler } from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';

// 404 handler - MUST be after all routes
app.use(notFound);

// Global error handler - MUST be last
app.use(errorHandler);

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});