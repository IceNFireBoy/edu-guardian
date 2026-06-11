import mongoose from 'mongoose';

const RETRY_DELAY_MS = 15_000;

export const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGO_URI || '';

  if (!mongoURI) {
    // Keep serving: a dead process means every request times out at the edge,
    // hiding the real problem. /health stays reachable for diagnosis.
    console.error('MongoDB URI is not defined. Please check your environment variables.');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error connecting to MongoDB: ${error.message}`);
    } else {
      console.error('Unknown error connecting to MongoDB');
    }
    // Exiting here put the deployment into a crash loop whenever the cluster
    // was unreachable (e.g. a paused Atlas cluster - querySrv ENOTFOUND).
    // Stay up and retry so the API recovers on its own once the DB is back.
    console.error(`Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s...`);
    setTimeout(() => {
      void connectDB();
    }, RETRY_DELAY_MS);
  }
};
