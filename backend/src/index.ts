import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import colors from 'colors'; // For colored console output
import app from './server'; // Import the Express app
import { initSocket } from './socket';

// Load env vars based on NODE_ENV
const envPath = process.env.NODE_ENV === 'production' 
    ? path.resolve(__dirname, '../.env') 
    : path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

// Port to run the server on
const PORT = process.env.PORT || 5000;

// Wrap the Express app in an HTTP server so Socket.IO can share the same port.
const server = http.createServer(app);
initSocket(server); // real-time study rooms

server.listen(PORT, () => {
  console.log(colors.yellow.bold(`[Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));
});

// Handle unhandled promise rejections. Log loudly but keep the process
// alive: exiting here turned any stray rejection (e.g. DB hiccups) into a
// full-site outage via a Render crash loop.
process.on('unhandledRejection', (err: Error) => {
  console.error(colors.red('[Backend] Unhandled Rejection:'), err.message);
});

export default server;
