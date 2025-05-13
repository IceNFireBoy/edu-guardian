// This file is likely obsolete, superseded by backend/src/server.ts.
// It appears to be a test/dev version of the root server.js.
// Original content of root temp-server.js:
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./middleware/error');
// We'll use a local MongoDB connection instead of the one from config
const mongoose = require('mongoose');

// Load env vars
dotenv.config();

// Define routes
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

const PORT = process.env.PORT || 5001;

// Skip DB connection for this test
console.log(`[Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`.yellow.bold);
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

// Note: We're skipping the MongoDB connection for testing purposes
// But the server will still work for basic route testing
const server = app.listen(PORT);

// Handle unhandled promise rejections (but simplified for this test)
process.on('unhandledRejection', (err) => {
  console.log(`[Backend] Error: ${err.message}`.red);
}); 