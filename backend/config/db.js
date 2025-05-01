const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`[Backend] MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
    return true;
  } catch (error) {
    console.error(`[Backend] MongoDB Connection Error: ${error.message}`.red.bold);
    console.error('[Backend] Make sure your MONGO_URI environment variable is set correctly'.yellow);
    // Don't exit process here, let the server handle it
    return false;
  }
};

module.exports = connectDB; 