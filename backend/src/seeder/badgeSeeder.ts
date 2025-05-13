import mongoose from 'mongoose';
import Badge, { IBadge } from '../models/Badge'; // Assuming Badge.ts and IBadge export
import colors from 'colors'; // Ensure @types/colors is installed
import dotenv from 'dotenv';

// Define a type for the badge data used for seeding, excluding generated fields like _id or slug
// This makes the `badges` array more type-safe.
// It's based on IBadge but makes fields like `createdAt` optional as they are defaulted by schema.
interface BadgeSeedData extends Omit<Partial<IBadge>, 'slug' | 'createdAt'> {
  name: string;
  description: string;
  icon: string;
  category: 'upload' | 'engagement' | 'streak' | 'achievement' | 'special' | 'xp' | 'notes'; // Added xp, notes based on data
  requirements: any; // Keep as any for flexibility or define a more specific type
  xpReward?: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isActive?: boolean;
  displayOrder?: number;
}

// Load env vars
dotenv.config({ path: './config/config.env' }); // Ensure this path is correct for script execution context

// Connect to DB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!, {
      // Mongoose 6+ no longer needs useNewUrlParser, useUnifiedTopology, useCreateIndex, useFindAndModify
      // Add any other necessary options here
    });
    console.log(colors.cyan('MongoDB Connected for Seeder...'));
  } catch (err: any) {
    console.error(colors.red(`Error connecting to MongoDB for Seeder: ${err.message}`));
    process.exit(1);
  }
};

// Badge data
const badges: BadgeSeedData[] = [
  // Streak badges
  {
    name: 'Beginner Streak',
    description: 'Maintained a 3-day learning streak',
    icon: 'streak-3',
    category: 'streak',
    requirements: 3,
    xpReward: 30,
    rarity: 'common',
    isActive: true,
    displayOrder: 1
  },
  {
    name: 'Consistent Learner',
    description: 'Maintained a 7-day learning streak',
    icon: 'streak-7',
    category: 'streak',
    requirements: 7,
    xpReward: 70,
    rarity: 'common',
    isActive: true,
    displayOrder: 2
  },
  {
    name: 'Dedicated Scholar',
    description: 'Maintained a 14-day learning streak',
    icon: 'streak-14',
    category: 'streak',
    requirements: 14,
    xpReward: 140,
    rarity: 'rare',
    isActive: true,
    displayOrder: 3
  },
  {
    name: 'Learning Machine',
    description: 'Maintained a 30-day learning streak',
    icon: 'streak-30',
    category: 'streak',
    requirements: 30,
    xpReward: 300,
    rarity: 'epic',
    isActive: true,
    displayOrder: 4
  },
  {
    name: 'Academic Titan',
    description: 'Maintained a 100-day learning streak',
    icon: 'streak-100',
    category: 'streak',
    requirements: 100,
    xpReward: 1000,
    rarity: 'legendary',
    isActive: true,
    displayOrder: 5
  },
  
  // XP badges (Category 'xp' was missing in IBadge but present in data, added to BadgeSeedData)
  {
    name: 'XP Novice',
    description: 'Earned 100 XP points',
    icon: 'xp-100',
    category: 'xp',
    requirements: 100,
    xpReward: 10,
    rarity: 'common',
    isActive: true,
    displayOrder: 10
  },
  {
    name: 'XP Apprentice',
    description: 'Earned 500 XP points',
    icon: 'xp-500',
    category: 'xp',
    requirements: 500,
    xpReward: 50,
    rarity: 'common',
    isActive: true,
    displayOrder: 11
  },
  {
    name: 'XP Scholar',
    description: 'Earned 1000 XP points',
    icon: 'xp-1000',
    category: 'xp',
    requirements: 1000,
    xpReward: 100,
    rarity: 'rare',
    isActive: true,
    displayOrder: 12
  },
  {
    name: 'XP Master',
    description: 'Earned 5000 XP points',
    icon: 'xp-5000',
    category: 'xp',
    requirements: 5000,
    xpReward: 500,
    rarity: 'epic',
    isActive: true,
    displayOrder: 13
  },
  {
    name: 'XP Guardian',
    description: 'Earned 10000 XP points',
    icon: 'xp-10000',
    category: 'xp',
    requirements: 10000,
    xpReward: 1000,
    rarity: 'legendary',
    isActive: true,
    displayOrder: 14
  },
  
  // Notes badges (Category 'notes' was missing in IBadge but present in data, added to BadgeSeedData)
  {
    name: 'Note Taker',
    description: 'Uploaded 5 notes',
    icon: 'notes-5',
    category: 'notes',
    requirements: 5,
    xpReward: 50,
    rarity: 'common',
    isActive: true,
    displayOrder: 20
  },
  {
    name: 'Diligent Scribe',
    description: 'Uploaded 15 notes',
    icon: 'notes-15',
    category: 'notes',
    requirements: 15,
    xpReward: 150,
    rarity: 'rare',
    isActive: true,
    displayOrder: 21
  },
  {
    name: 'Prolific Author',
    description: 'Uploaded 30 notes',
    icon: 'notes-30',
    category: 'notes',
    requirements: 30,
    xpReward: 300,
    rarity: 'epic',
    isActive: true,
    displayOrder: 22
  },
  {
    name: 'Knowledge Repository',
    description: 'Uploaded 100 notes',
    icon: 'notes-100',
    category: 'notes',
    requirements: 100,
    xpReward: 1000,
    rarity: 'legendary',
    isActive: true,
    displayOrder: 23
  },
  
  // Achievement badges
  {
    name: 'First Share',
    description: 'Shared your first note with others',
    icon: 'achievement-share',
    category: 'achievement',
    requirements: 'Share a note with another user', // Example of string requirement
    xpReward: 50,
    rarity: 'common',
    isActive: true,
    displayOrder: 30
  },
  {
    name: 'Perfect Score',
    description: 'Achieved a perfect score on a quiz',
    icon: 'achievement-quiz',
    category: 'achievement',
    requirements: 'Score 100% on any quiz',
    xpReward: 100,
    rarity: 'rare',
    isActive: true,
    displayOrder: 31
  },
  // ... (Add other badges if any were truncated from the original file content)
];

const importData = async () => {
  try {
    await Badge.deleteMany({}); // Clear existing badges
    // Using create for potentially better performance with many documents and Mongoose middleware (like slug generation)
    await Badge.create(badges);
    console.log(colors.green.inverse('Badge Data Imported!'));
    process.exit();
  } catch (err: any) {
    console.error(colors.red.inverse(`Error importing badge data: ${err.message}`));
    process.exit(1);
  }
};

const deleteData = async () => {
  try {
    await Badge.deleteMany({});
    console.log(colors.red.inverse('Badge Data Destroyed!'));
    process.exit();
  } catch (err: any) {
    console.error(colors.red.inverse(`Error destroying badge data: ${err.message}`));
    process.exit(1);
  }
};

const runSeeder = async () => {
  await connectDB(); // Ensure DB is connected before operations

  if (process.argv[2] === '-i') {
    await importData();
  } else if (process.argv[2] === '-d') {
    await deleteData();
  } else {
    console.log(colors.yellow('Please use -i to import data or -d to delete data.'));
    process.exit(0);
  }
};

runSeeder(); 