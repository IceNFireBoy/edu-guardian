import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI || '';
    
    if (!mongoURI) {
      console.error('MongoDB URI is not defined. Please check your environment variables.');
      throw new Error('MongoDB URI is not defined');
    }
    
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error connecting to MongoDB: ${error.message}`);
    } else {
      console.error('Unknown error connecting to MongoDB');
    }
    // Allow process to continue even if DB connection fails in development
    // In production, we might want to exit the process here
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}; 