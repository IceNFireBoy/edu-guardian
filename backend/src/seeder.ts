import fs from 'fs';
import mongoose from 'mongoose';
import colors from 'colors';
import dotenv from 'dotenv';

// Load models (ensure these paths are correct and models export default)
import Badge, { IBadge } from './models/Badge'; 
import User, { IUser } from './models/User';   
import Note, { INote } from './models/Note';   

// Define types for seed data - these should ideally match the structure of your JSON files
// and be compatible with IBadge, IUser, INote for creation.
// Using Partial as an example, but more specific types are better.
type BadgeSeed = Partial<IBadge>;
type UserSeed = Partial<IUser>;
type NoteSeed = Partial<INote>;

// Load env vars
dotenv.config({ path: './config/config.env' }); // Check/adjust path for script execution context

// Connect to DB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!, {
      // Mongoose 6+ options simplified
    });
    console.log(colors.cyan('MongoDB Connected for Main Seeder...'));
  } catch (err: any) {
    console.error(colors.red(`Error connecting to MongoDB for Main Seeder: ${err.message}`));
    process.exit(1);
  }
};

// Read JSON files
// These will throw if files are not found or JSON is invalid. Consider try-catch for robustness.
const badges: BadgeSeed[] = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/badges.json`, 'utf-8')
);

const users: UserSeed[] = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8')
);

const notes: NoteSeed[] = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/notes.json`, 'utf-8')
);

// Import into DB
const importData = async () => {
  try {
    await Badge.create(badges as any); // Using 'as any' if BadgeSeed is not perfectly assignable; refine types if possible
    await User.create(users as any);   // Using 'as any' if UserSeed is not perfectly assignable
    await Note.create(notes as any);   // Using 'as any' if NoteSeed is not perfectly assignable
    console.log(colors.green.inverse('Data Imported via Main Seeder!'));
    process.exit(0); // Exit after successful import
  } catch (err: any) {
    console.error(colors.red(`Error importing data via Main Seeder: ${err.message}`));
    process.exit(1); // Exit with error code
  }
};

// Delete data
const deleteData = async () => {
  try {
    await Badge.deleteMany({});
    await User.deleteMany({});
    await Note.deleteMany({});
    console.log(colors.red.inverse('Data Destroyed via Main Seeder!'));
    process.exit(0); // Exit after successful deletion
  } catch (err: any) {
    console.error(colors.red(`Error destroying data via Main Seeder: ${err.message}`));
    process.exit(1); // Exit with error code
  }
};

const runSeeder = async () => {
  await connectDB();

  if (process.argv[2] === '-i') {
    await importData();
  } else if (process.argv[2] === '-d') {
    await deleteData();
  } else {
    console.log(colors.yellow('Please provide proper flag: -i to import, -d to delete data.'));
    process.exit(0);
  }
};

runSeeder(); 