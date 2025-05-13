const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

// Load env vars - explicitly use the config.env file
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const noteRoutes = require('./routes/noteRoutes');
const badgeRoutes = require('./routes/badgeRoutes');

const app = express();

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cookie parser
app.use(cookieParser());

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

// Enable CORS - Allow all origins in development
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/badges', badgeRoutes);

// Error handler middleware
app.use(errorHandler);

// Print environment for debugging (remove sensitive data)
console.log('Using MongoDB URI:', process.env.MONGO_URI ? 'Set correctly' : 'NOT SET');
console.log('Port:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Cloudinary Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set correctly' : 'NOT SET');

// Force PORT to be 5001
const PORT = 5001;

const server = app.listen(
  PORT,
  () => {
    console.log(`[Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`.yellow.bold);
    
    // Log API Routes with better formatting
    console.log(`[Backend] API Routes:`.green);
    console.log(`[Backend] Notes API:`.cyan);
    console.log(`[Backend] - GET    /api/v1/notes             - Get all notes (can use query filters)`.gray);
    console.log(`[Backend] - POST   /api/v1/notes             - Create new note`.gray);
    console.log(`[Backend] - GET    /api/v1/notes/:id         - Get single note by ID`.gray);
    console.log(`[Backend] - PUT    /api/v1/notes/:id         - Update note`.gray);
    console.log(`[Backend] - DELETE /api/v1/notes/:id         - Delete note`.gray);
    console.log(`[Backend] - GET    /api/v1/notes/filter      - Filter notes by criteria`.gray);
    console.log(`[Backend] - POST   /api/v1/notes/:id/ratings - Rate a note`.gray);
    console.log(`[Backend] - PUT    /api/v1/notes/:id/download - Increment download count`.gray);
    
    // MongoDB connection status
    console.log(`[Backend] MongoDB: Connected`.green);
  }
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`[Backend] Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
}); 