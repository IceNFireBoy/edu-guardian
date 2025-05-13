import cloudinaryV2 from 'cloudinary';
import Note from '../models/Note'; // Assuming Note.ts exists
import asyncHandler from '../middleware/async'; // Assuming async.ts exists
import ErrorResponse from '../utils/errorResponse'; // Assuming errorResponse.ts exists or will be created
import dotenv from 'dotenv';

// Load env vars if not already loaded (e.g. when run as a script)
if (process.env.NODE_ENV !== 'production') { // A common check, adjust if needed
    dotenv.config({ path: './config/config.env' }); // Adjust path if script is run from a different CWD
}

// Configure Cloudinary
const cloudinary = cloudinaryV2.v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Cleanup script to remove Cloudinary resources that are no longer referenced in the database.
 * This helps prevent orphaned files in Cloudinary.
 */
const cleanupDeletedCloudinaryFiles = async (): Promise<void> => {
  try {
    console.log('Starting Cloudinary cleanup process...');

    // Get all notes from database
    const notes = await Note.find().select('cloudinaryPublicId').exec();
    const validPublicIds = notes
      .map(note => note.cloudinaryPublicId)
      .filter((id): id is string => !!id); // Type guard to ensure only strings

    // Get all resources from Cloudinary
    // Types for Cloudinary search results might need to be more specific if available
    const { resources } = await cloudinary.search
      .expression('folder:notes/*') // Ensure this folder name is correct
      .max_results(500) // Consider pagination if more than 500 resources
      .execute() as { resources: { public_id: string }[] };

    // Find orphaned resources (in Cloudinary but not in DB)
    const orphanedResources = resources.filter(resource => 
      !validPublicIds.includes(resource.public_id)
    );

    console.log(`Found ${orphanedResources.length} orphaned resources to delete.`);

    // Delete orphaned resources
    if (orphanedResources.length > 0) {
      const publicIdsToDelete = orphanedResources.map(r => r.public_id);
      // Batch delete if API supports it, or delete one by one
      // For simplicity, deleting one by one here. For many files, batch deletion is better.
      for (const publicId of publicIdsToDelete) {
        try {
          await cloudinary.uploader.destroy(publicId);
          console.log(`Deleted orphaned resource: ${publicId}`);
        } catch (err) {
          console.error(`Failed to delete resource ${publicId}:`, err);
          // Decide if one failure should stop the whole script or just log and continue
        }
      }
    } else {
      console.log('No orphaned resources found.');
    }

    console.log('Cloudinary cleanup process completed successfully.');
  } catch (err: any) {
    console.error('Error during Cloudinary cleanup process:', err);
    // Depending on how this script is run, ErrorResponse might not be handled by Express middleware
    // So, just throwing a standard error might be more appropriate if run standalone.
    throw new Error(`Failed to cleanup Cloudinary resources: ${err.message}`);
  }
};

// Run cleanup if script is called directly
// Using a more common TypeScript check for direct execution
if (require.main === module) {
  cleanupDeletedCloudinaryFiles()
    .then(() => {
      console.log('Script finished successfully.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Script failed:', err);
      process.exit(1);
    });
}

export default cleanupDeletedCloudinaryFiles; 