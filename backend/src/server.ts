import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import xss from 'xss-clean';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import errorHandler from './middleware/error';
import { initSocket } from './socket';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import noteRoutes from './routes/noteRoutes';
import badgeRoutes from './routes/badgeRoutes';
import adminRoutes from './routes/adminRoutes';
import aiRoutes from './routes/aiRoutes';
import srsRoutes from './routes/srsRoutes';

const app = express();

// Gzip responses (badge catalogs, note lists, leaderboards compress well)
app.use(compression());

// Body parser. Files upload browser -> Cloudinary directly and never pass
// through this API, so a small JSON limit is enough and shields the server
// from oversized-payload abuse (was 50mb).
app.use(express.json({ limit: '2mb' }));

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP in development
  crossOriginEmbedderPolicy: false, // Allow embedding
}));

// Enable CORS
// FRONTEND_URL may be a single origin or a comma-separated list
const allowedOrigins = (process.env.FRONTEND_URL || 'https://eduguardian.netlify.app')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? allowedOrigins
    : true, // Allow all origins in development
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Log cors configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('CORS configured with options:', corsOptions);
}

// Sanitize data
app.use(mongoSanitize());

// Fix xss and hpp middleware calls
// @ts-ignore - xss doesn't have proper TypeScript definitions
app.use(xss());
// @ts-ignore - hpp doesn't have proper TypeScript definitions
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 300 // limit each IP to 300 requests per windowMs
});
app.use(limiter);

// Health check used by the frontend and for production diagnosis: reports
// whether the DB is reachable and whether required env vars are present
// (booleans only - never the values).
const healthCheck = (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: 'API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mongoUriConfigured: Boolean(process.env.MONGO_URI),
    jwtSecretConfigured: Boolean(process.env.JWT_SECRET)
  });
};

app.get('/api/test', healthCheck);

// Same health check on /api/v1/test to match frontend health check
app.get('/api/v1/test', healthCheck);

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/badges', badgeRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/srs', srsRoutes);

// Error handler
app.use(errorHandler);

// Start the server if this file is run directly (dev entry: ts-node-dev server.ts)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const httpServer = http.createServer(app);
  initSocket(httpServer); // attach real-time study rooms to the same server
  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

// Handle unhandled promise rejections. Log loudly but keep the process
// alive: exiting here turned any stray rejection (e.g. DB hiccups) into a
// full-site outage via a Render crash loop.
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err);
});

export default app; 