const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// First run TypeScript compiler
console.log('Running TypeScript compiler...');
try {
  execSync('tsc', { stdio: 'inherit' });
  console.log('TypeScript compilation complete.');
} catch (error) {
  console.error('TypeScript compilation failed:', error.message);
  process.exit(1);
}

// Check if dist/server.js exists
const serverJsPath = path.join(__dirname, 'dist', 'server.js');
if (!fs.existsSync(serverJsPath)) {
  console.error('Error: server.js not found in dist folder after compilation');
  
  // If server.ts exists but wasn't compiled properly, create a minimal server.js
  const serverTsPath = path.join(__dirname, 'src', 'server.ts');
  if (fs.existsSync(serverTsPath)) {
    console.log('Creating minimal server.js from app.js...');
    
    // Make sure app.js exists
    const appJsPath = path.join(__dirname, 'dist', 'app.js');
    if (fs.existsSync(appJsPath)) {
      // Create a server.js that imports app.js
      const serverContent = `
const app = require('./app').default;
const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(\`Server running in \${process.env.NODE_ENV} mode on port \${port}\`);
});

process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection! Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});
      `;
      
      fs.writeFileSync(serverJsPath, serverContent);
      console.log('Created server.js successfully.');
    } else {
      console.error('Error: app.js not found in dist folder, cannot create server.js');
      process.exit(1);
    }
  } else {
    console.error('Error: server.ts not found in src folder');
    process.exit(1);
  }
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