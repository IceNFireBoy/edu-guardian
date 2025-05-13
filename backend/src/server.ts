import path from 'path';
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import colors from 'colors';
import fileupload from 'express-fileupload';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import errorHandler from './middleware/error';
import connectDB from '../config/db';
import hpp from 'hpp';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../config/config.env') });

// Connect to database
connectDB();

// Route files
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import noteRoutes from './routes/noteRoutes';
import badgeRoutes from './routes/badgeRoutes';
import adminRoutes from './routes/adminRoutes';

const app: Express = express();

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cookie parser
app.use(cookieParser());

// Security Middleware
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 1000 // Max 1000 requests per 10 minutes per IP. TODO: Adjust as needed
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File uploading
app.use(fileupload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  useTempFiles: true,
  tempFileDir: '/tmp/',
  debug: process.env.NODE_ENV === 'development'
}));

// Enable CORS
if (process.env.NODE_ENV === 'development') {
  console.log('[Backend] Enabling permissive CORS for development'.yellow);
  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
} else {
  // Production CORS configuration
  // TODO: Update with your production frontend URL
  app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
}

// Set static folder
app.use(express.static(path.resolve(__dirname, '../public')));

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/badges', badgeRoutes);
app.use('/api/v1/admin', adminRoutes);

// Centralized error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`[Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`.yellow.bold);
  // Removed extensive API route logging
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, promise) => {
  console.log(`[Backend] Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default server; 