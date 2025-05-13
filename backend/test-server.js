const express = require('express');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Body parser middleware
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Express server is running correctly',
    environment: process.env.NODE_ENV,
    port: process.env.PORT
  });
});

// Mock route for authentication
app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'Registration route is working',
    data: {
      user: {
        email: req.body.email || 'test@example.com',
        name: req.body.name || 'Test User'
      }
    }
  });
});

// Set port from environment variables or default to 5000
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Environment variables loaded: JWT_SECRET=${process.env.JWT_SECRET ? 'exists' : 'missing'}`);
  console.log('Server structure and routing is set up correctly');
  console.log('NOTE: MongoDB connection was skipped for testing purposes');
}); 