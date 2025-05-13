// This file has been superseded by backend/src/scripts/cleanupDeletedCloudinaryFiles.ts
const cloudinary = require('cloudinary').v2;
const Note = require('../models/Note');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Cleanup script to remove Cloudinary resources that are no longer referenced in the database
 * This helps prevent orphaned files in Cloudinary
 */
const cleanupDeletedCloudinaryFiles = async () => {
  try {
    console.log('Starting Cloudinary cleanup process...');

    // Get all notes from database
    const notes = await Note.find().select('cloudinaryPublicId');
    const validPublicIds = notes.map(note => note.cloudinaryPublicId).filter(Boolean);

    // Get all resources from Cloudinary
    const { resources } = await cloudinary.search
      .expression('folder:notes/*')
      .max_results(500)
      .execute();

    // Find orphaned resources (in Cloudinary but not in DB)
    const orphanedResources = resources.filter(resource => 
      !validPublicIds.includes(resource.public_id)
    );

    console.log(`Found ${orphanedResources.length} orphaned resources`);

    // Delete orphaned resources
    for (const resource of orphanedResources) {
      try {
        await cloudinary.uploader.destroy(resource.public_id);
        console.log(`Deleted orphaned resource: ${resource.public_id}`);
      } catch (err) {
        console.error(`Failed to delete resource ${resource.public_id}:`, err);
      }
    }

    console.log('Cleanup process completed successfully');
  } catch (err) {
    console.error('Error during cleanup:', err);
    throw new ErrorResponse('Failed to cleanup Cloudinary resources', 500);
  }
};

// Run cleanup if script is called directly
if (require.main === module) {
  cleanupDeletedCloudinaryFiles()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = cleanupDeletedCloudinaryFiles; 