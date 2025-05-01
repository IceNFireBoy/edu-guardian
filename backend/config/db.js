const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Add connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    // Test the connection by trying to get server info
    const adminDb = conn.connection.db.admin();
    const serverInfo = await adminDb.serverInfo();
    
    console.log(`[Backend] MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
    console.log(`[Backend] MongoDB Version: ${serverInfo.version}`.cyan);
    console.log(`[Backend] MongoDB Features:`.cyan);
    console.log(`[Backend] - Write Concern: ${conn.connection.writeConcern?.w || 'default'}`.gray);
    console.log(`[Backend] - Read Preference: ${conn.connection.readPreference?.mode || 'primary'}`.gray);
    
    // Test write operation
    const testDoc = await mongoose.connection.db.collection('connection_test').insertOne({
      test: true,
      timestamp: new Date()
    });
    
    if (testDoc.acknowledged) {
      console.log(`[Backend] MongoDB Write Test: Successful`.green);
      // Clean up test document
      await mongoose.connection.db.collection('connection_test').deleteOne({ _id: testDoc.insertedId });
    }
    
    return true;
  } catch (error) {
    console.error(`[Backend] MongoDB Connection Error: ${error.message}`.red.bold);
    console.error('[Backend] Error Details:'.yellow);
    console.error(`[Backend] - Name: ${error.name}`.gray);
    console.error(`[Backend] - Code: ${error.code || 'N/A'}`.gray);
    console.error(`[Backend] - CodeName: ${error.codeName || 'N/A'}`.gray);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('[Backend] Could not resolve MongoDB host. Check your MONGO_URI'.yellow);
    } else if (error.message.includes('ETIMEDOUT')) {
      console.error('[Backend] Connection timed out. Check your network or MongoDB host'.yellow);
    } else if (error.message.includes('Authentication failed')) {
      console.error('[Backend] Authentication failed. Check your credentials in MONGO_URI'.yellow);
    } else {
      console.error('[Backend] Make sure your MONGO_URI environment variable is set correctly'.yellow);
    }
    
    return false;
  }
};

module.exports = connectDB; 