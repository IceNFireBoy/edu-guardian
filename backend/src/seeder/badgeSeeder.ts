import mongoose from 'mongoose';
import { Badge } from '../models/Badge';
import { IBadge } from '../interfaces/Badge';
import colors from 'colors'; // Ensure @types/colors is installed
import dotenv from 'dotenv';

// Define a type for the badge data used for seeding, excluding generated fields like _id or slug
// This makes the `badges` array more type-safe.
// It's based on IBadge but makes fields like `createdAt` optional as they are defaulted by schema.
interface BadgeSeedData {
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'engagement' | 'ai' | 'achievement';
  criteria: {
    type: string;
    threshold: number;
  };
  xpReward: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
  displayOrder: number;
}

// Load env vars
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: './.env.development' });
} else {
  dotenv.config();
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const badgeData: Partial<IBadge>[] = [
  {
    name: 'First Note',
    description: 'Created your first note',
    category: 'achievement',
    criteria: {
      type: 'note_created',
      threshold: 1
    },
    xpReward: 50,
    rarity: 'common',
    isActive: true,
    displayOrder: 1
  },
  {
    name: 'Note Master',
    description: 'Created 10 notes',
    category: 'achievement',
    criteria: {
      type: 'note_created',
      threshold: 10
    },
    xpReward: 200,
    rarity: 'uncommon',
    isActive: true,
    displayOrder: 2
  },
  {
    name: 'Study Streak',
    description: 'Studied for 7 days in a row',
    category: 'streak',
    criteria: {
      type: 'study_streak',
      threshold: 7
    },
    xpReward: 300,
    rarity: 'rare',
    isActive: true,
    displayOrder: 3
  }
];

const importData = async () => {
  try {
    await connectDB();

    await Badge.deleteMany();
    await Badge.insertMany(badgeData);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const deleteData = async () => {
  try {
    await connectDB();

    await Badge.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log(colors.yellow('Please use -i to import data or -d to delete data.'));
  process.exit(0);
} 