const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const noteRoutes = require('./routes/noteRoutes');
const badgeRoutes = require('./routes/badgeRoutes');

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File uploading
app.use(fileupload());

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS with improved configuration
const allowedOrigins = ['http://localhost:5173', 'https://eduguardian.netlify.app'];
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
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

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  () => {
    const corsOrigins = allowedOrigins.join(', ');
    console.log(`[Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`.yellow.bold);
    console.log(`[Backend] CORS enabled for origins: ${corsOrigins}`.cyan);
    console.log(`[Backend] API Routes:`.green);
    console.log(`[Backend] - POST /api/v1/notes - Create new note`.gray);
    console.log(`[Backend] - GET /api/v1/notes - Get notes with filtering`.gray);
    console.log(`[Backend] - GET /api/v1/notes/:id - Get single note`.gray);
  }
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`[Backend] Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
}); 