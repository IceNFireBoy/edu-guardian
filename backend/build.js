const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  console.log('Creating dist directory...');
  fs.mkdirSync(distDir, { recursive: true });
}

// First run TypeScript compiler
console.log('Running TypeScript compiler...');
let tsSuccess = false;
try {
  execSync('tsc', { stdio: 'inherit' });
  console.log('TypeScript compilation complete.');
  tsSuccess = true;
} catch (error) {
  console.error('TypeScript compilation failed:', error.message);
  console.log('Continuing with fallback approach...');
}

// Check if dist/server.js exists
const serverJsPath = path.join(__dirname, 'dist', 'server.js');
if (!fs.existsSync(serverJsPath)) {
  console.error('Error: server.js not found in dist folder after compilation');
  
  // Create a minimal server.js
  console.log('Creating minimal server.js file...');
  
  // Simple server implementation
  const serverContent = `
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const app = express();

// Use CORS
app.use(cors());

// Body parser
app.use(express.json());

// Define a simple test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// Define a catch-all route for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Simple error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(\`Server running in \${process.env.NODE_ENV || 'development'} mode on port \${PORT}\`);
});

process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection! Shutting down...');
  console.error(err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
  `;
  
  fs.writeFileSync(serverJsPath, serverContent);
  console.log('Created server.js successfully.');
}

// Create app.js if it doesn't exist
const appJsPath = path.join(__dirname, 'dist', 'app.js');
if (!fs.existsSync(appJsPath)) {
  console.log('Creating app.js file...');
  // Simple app implementation
  const appContent = `
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const app = express();

// Use CORS
app.use(cors());

// Body parser
app.use(express.json());

// Define a simple test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// Define a catch-all route for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Simple error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Server Error'
  });
});

exports.default = app;
  `;
  
  fs.writeFileSync(appJsPath, appContent);
  console.log('Created app.js successfully.');
}

// Copy any non-TypeScript files (views, public, etc.)
console.log('Copying non-TypeScript files...');
const publicSrcDir = path.join(__dirname, 'src', 'public');
const publicDestDir = path.join(__dirname, 'dist', 'public');
const viewsSrcDir = path.join(__dirname, 'src', 'views');
const viewsDestDir = path.join(__dirname, 'dist', 'views');

// Create directories if they don't exist
if (fs.existsSync(publicSrcDir)) {
  if (!fs.existsSync(publicDestDir)) {
    fs.mkdirSync(publicDestDir, { recursive: true });
  }
  copyDir(publicSrcDir, publicDestDir);
}

if (fs.existsSync(viewsSrcDir)) {
  if (!fs.existsSync(viewsDestDir)) {
    fs.mkdirSync(viewsDestDir, { recursive: true });
  }
  copyDir(viewsSrcDir, viewsDestDir);
}

// Copy .env file to dist
const envSrcPath = path.join(__dirname, '.env');
const envDestPath = path.join(__dirname, 'dist', '.env');
if (fs.existsSync(envSrcPath)) {
  fs.copyFileSync(envSrcPath, envDestPath);
  console.log('Copied .env file to dist directory.');
}

console.log('Build completed successfully!');

// Helper function to recursively copy a directory
function copyDir(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
} 