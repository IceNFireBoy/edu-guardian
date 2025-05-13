// This file has been superseded by backend/src/seeder/badgeSeeder.ts
const mongoose = require('mongoose');
const Badge = require('../models/Badge');
const colors = require('colors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Badge data
const badges = [
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
  // ... (rest of the original badge data) ...
];

const importData = async () => {
  try {
    await Badge.deleteMany();
    await Badge.create(badges);
    console.log('Badge Data Imported!'.green.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const deleteData = async () => {
  try {
    await Badge.deleteMany();
    console.log('Badge Data Destroyed!'.red.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Please use -i to import data or -d to delete data.');
  process.exit(0);
} 