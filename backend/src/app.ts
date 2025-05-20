// app.ts - Express application for testing
import express from 'express';
import cors from 'cors';
import 'colors';

// Create Express app
const app = express();

// Apply middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Define a simple test route
app.get('/api/test', (_req, res) => {
  res.json({ success: true, message: 'API is running' });
});

export default app; 