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
  
  // XP badges
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
  
  // Notes badges
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
    requirements: 'Share a note with another user',
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
  {
    name: 'Subject Master',
    description: 'Completed all topics in a subject',
    icon: 'achievement-subject',
    category: 'achievement',
    requirements: 'Complete all topics in any subject',
    xpReward: 300,
    rarity: 'epic',
    isActive: true,
    displayOrder: 32
  },
  {
    name: 'Top Contributor',
    description: 'Recognized as a top contributor in the community',
    icon: 'achievement-top',
    category: 'achievement',
    requirements: 'Reach the top 10 on the leaderboard',
    xpReward: 500,
    rarity: 'legendary',
    isActive: true,
    displayOrder: 33
  }
];

// Import all badges
const importData = async () => {
  try {
    await Badge.deleteMany(); // Clear existing badges
    await Badge.insertMany(badges);
    
    console.log('Badges imported successfully!'.green.inverse);
    process.exit();
  } catch (err) {
    console.error(`Error: ${err.message}`.red);
    process.exit(1);
  }
};

// Delete all badges
const deleteData = async () => {
  try {
    await Badge.deleteMany();
    
    console.log('All badges deleted!'.red.inverse);
    process.exit();
  } catch (err) {
    console.error(`Error: ${err.message}`.red);
    process.exit(1);
  }
};

// Command line args to determine action
if (process.argv[2] === '-d') {
  deleteData();
} else {
  importData();
} 