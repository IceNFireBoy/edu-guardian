const express = require('express');
const colors = require('colors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Create test user (comment out after first run)
const User = require('./models/User');
const createTestUser = async () => {
  try {
    // Check if test user already exists
    const userExists = await User.findOne({ email: 'test@example.com' });
    
    if (userExists) {
      console.log('Test user already exists'.yellow);
      return;
    }
    
    // Create test admin user
    await User.create({
      name: 'Test Admin',
      email: 'test@example.com',
      password: 'password123',
      username: 'testadmin',
      role: 'admin'
    });
    
    console.log('Test admin user created'.green);
    
    // Create test regular user
    await User.create({
      name: 'Test User',
      email: 'user@example.com',
      password: 'password123',
      username: 'testuser',
      role: 'user'
    });
    
    console.log('Test regular user created'.green);
  } catch (err) {
    console.error('Error creating test users:', err);
  }
};

// Create Express app
const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Routes for testing
app.post('/api/test/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }
    
    // Check for user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Get token
    const token = user.getSignedJwtToken();
    
    // Set cookie
    const options = {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
      httpOnly: true
    };
    
    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }
    
    res.status(200)
      .cookie('token', token, options)
      .json({
        success: true,
        token
      });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

app.get('/api/test/protected', async (req, res) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } catch (err) {
    console.error('Protected route error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Connect to MongoDB
connectDB()
  .then(() => {
    // Create test users
    createTestUser();
    
    // Start server
    const PORT = 5002;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`.yellow.bold);
      console.log(`Test routes:`.cyan);
      console.log(`POST /api/test/login - Test login`.gray);
      console.log(`GET /api/test/protected - Test protected route`.gray);
      console.log(`Test credentials:`.cyan);
      console.log(`Admin: test@example.com / password123`.gray);
      console.log(`User: user@example.com / password123`.gray);
    });
  })
  .catch((err) => {
    console.error(`Database connection error: ${err.message}`.red);
    process.exit(1);
  }); 