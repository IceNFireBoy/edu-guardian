import dotenv from 'dotenv';
import path from 'path';
import colors from 'colors'; // For colored console output

// Load env vars based on NODE_ENV
const envPath = process.env.NODE_ENV === 'production' 
    ? path.resolve(__dirname, '../config/config.env') 
    : path.resolve(__dirname, '../config/config.dev.env');

dotenv.config({ path: envPath });

// Must be after dotenv.config to ensure DB_STRING is loaded from the correct .env file
import connectDB from '../config/db'; 
import app from './server'; // Assuming server.ts exports the app

colors.enable(); // Enable colors

// Connect to database
connectDB()
  .then(() => {
    console.log(colors.cyan('[Backend] MongoDB Connected successfully.'));
    // Start the server only after successful DB connection
    const PORT = process.env.PORT ?? 5001;
    // The server is already started in server.ts, we just log here or ensure it is.
    // If app is not already listening, then: app.listen(PORT, () => console.log(colors.yellow.bold(`[Backend] Server running in ${process.env.NODE_ENV ?? 'development'} mode on port ${PORT}`)));
    // Since server.ts starts the server, this file (index.ts) primarily handles DB connection and initial setup.
  })
  .catch(err => {
    console.error(colors.red('[Backend] MongoDB Connection Failed:'), err.message);
    process.exit(1); // Exit process with failure
  });

// The server instance is created and started in server.ts
// process.on('unhandledRejection', ...) is also in server.ts
