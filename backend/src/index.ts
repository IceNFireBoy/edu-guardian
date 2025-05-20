import dotenv from 'dotenv';
import path from 'path';
import colors from 'colors'; // For colored console output
import app from './server'; // Import the Express app

// Load env vars based on NODE_ENV
const envPath = process.env.NODE_ENV === 'production' 
    ? path.resolve(__dirname, '../.env') 
    : path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

// Port to run the server on
const PORT = process.env.PORT || 5000;

// Start the server
const server = app.listen(PORT, () => {
  console.log(colors.yellow.bold(`[Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error(colors.red('[Backend] Unhandled Rejection:'), err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

export default server;
