/**
 * Cleanup Deleted Cloudinary Files Script
 * 
 * This script checks all notes in the database and removes entries
 * with broken or deleted Cloudinary links.
 * 
 * Usage: node cleanupDeletedCloudinaryFiles.js
 */

const mongoose = require('mongoose');
const axios = require('axios');
const Note = require('../models/Note');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

/**
 * Check if a Cloudinary URL is still valid
 * @param {string} url - The Cloudinary URL to check
 * @returns {Promise<boolean>} - True if the URL is accessible, false otherwise
 */
const isCloudinaryUrlValid = async (url) => {
  try {
    if (!url) return false;
    
    // Skip non-Cloudinary URLs
    if (!url.includes('cloudinary.com')) {
      console.log(`Skipping non-Cloudinary URL: ${url}`);
      return true; // Assume valid for non-Cloudinary URLs
    }

    const response = await axios.head(url, { 
      timeout: 5000,
      validateStatus: false // Don't throw on error status codes
    });
    
    if (response.status >= 400) {
      console.log(`❌ Invalid URL (${response.status}): ${url}`);
      return false;
    }
    
    console.log(`✅ Valid URL: ${url}`);
    return true;
  } catch (err) {
    console.error(`❌ Error checking URL: ${url}`, err.message);
    return false;
  }
};

/**
 * Main function to clean up the database
 */
const cleanupDatabase = async () => {
  try {
    console.log('Starting database cleanup of broken Cloudinary URLs...');
    
    // Get all notes
    const notes = await Note.find();
    console.log(`Found ${notes.length} notes in the database`);
    
    let removedCount = 0;
    let validCount = 0;
    
    // Process notes in sequence to avoid overwhelming the server
    for (const note of notes) {
      const url = note.fileUrl || note.secure_url;
      
      if (!url) {
        console.log(`❌ Note ${note._id} has no URL, marking for removal`);
        await Note.findByIdAndDelete(note._id);
        removedCount++;
        continue;
      }
      
      const isValid = await isCloudinaryUrlValid(url);
      
      if (!isValid) {
        console.log(`❌ Removing note with ID: ${note._id} (broken URL: ${url})`);
        await Note.findByIdAndDelete(note._id);
        removedCount++;
      } else {
        validCount++;
      }
    }
    
    console.log('\n--- Cleanup Summary ---');
    console.log(`Total notes: ${notes.length}`);
    console.log(`Valid notes: ${validCount}`);
    console.log(`Removed notes: ${removedCount}`);
    console.log('-----------------------');
    
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    // Close database connection
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the cleanup
cleanupDatabase(); 