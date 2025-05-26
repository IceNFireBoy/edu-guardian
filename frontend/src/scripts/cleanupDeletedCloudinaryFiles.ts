import { Note } from '../models/Note';
import { connectDB } from '../config/database';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const cleanupDeletedCloudinaryFiles = async () => {
  try {
    await connectDB();

    // Get all notes with fileUrl
    const notes = await Note.find({ fileUrl: { $exists: true, $ne: null } });
    console.log(`Found ${notes.length} notes with fileUrl`);

    // Get all files from Cloudinary
    const cloudinaryFiles = await cloudinary.api.resources({
      type: 'upload',
      max_results: 500
    });

    // Create a map of Cloudinary public_ids
    const cloudinaryPublicIds = new Set(
      cloudinaryFiles.resources.map((file: any) => file.public_id)
    );

    // Find files that exist in Cloudinary but not in our database
    const orphanedFiles = cloudinaryFiles.resources.filter((file: any) => {
      return !notes.some(note => note.fileUrl?.includes(file.public_id));
    });

    console.log(`Found ${orphanedFiles.length} orphaned files`);

    // Delete orphaned files
    for (const file of orphanedFiles) {
      try {
        await cloudinary.uploader.destroy(file.public_id);
        console.log(`Deleted file: ${file.public_id}`);
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

cleanupDeletedCloudinaryFiles(); 