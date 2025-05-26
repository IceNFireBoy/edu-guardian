import { v2 as cloudinaryV2 } from 'cloudinary';
import Note from '../models/Note';
import asyncHandler from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';
import dotenv from 'dotenv';

// Load env vars
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: './.env.development' });
} else {
  dotenv.config();
}

// Configure Cloudinary
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Cleanup script to remove Cloudinary resources that are no longer referenced in the database.
 * This helps prevent orphaned files in Cloudinary.
 */
const cleanupDeletedCloudinaryFiles = async () => {
  try {
    console.log('Starting cleanup of orphaned Cloudinary files...');

    // Get all notes from database
    const notes = await Note.find().select('fileUrl');
    console.log(`Found ${notes.length} notes in database`);

    // Create a set of valid public IDs from database
    const validPublicIds = new Set<string>();
    notes.forEach(note => {
      if (note.fileUrl) {
        const match = note.fileUrl.match(/\/v\d+\/([^/]+)\./);
        if (match && match[1]) {
          validPublicIds.add(match[1]);
        }
      }
    });
    console.log(`Found ${validPublicIds.size} valid public IDs in database`);

    // Get all resources from Cloudinary
    const { resources } = await cloudinaryV2.api.resources({
      type: 'upload',
      max_results: 500
    });
    console.log(`Found ${resources.length} resources in Cloudinary`);

    // Find orphaned files (files in Cloudinary but not in database)
    const orphanedFiles = resources.filter(resource => !validPublicIds.has(resource.public_id));
    console.log(`Found ${orphanedFiles.length} orphaned files`);

    // Delete orphaned files
    for (const file of orphanedFiles) {
      try {
        await cloudinaryV2.uploader.destroy(file.public_id);
        console.log(`Successfully deleted orphaned file: ${file.public_id}`);
      } catch (error) {
        console.error(`Error deleting file ${file.public_id}:`, error);
      }
    }

    console.log('Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

// Run the cleanup if this script is called directly
if (require.main === module) {
  cleanupDeletedCloudinaryFiles();
}

export default cleanupDeletedCloudinaryFiles; 