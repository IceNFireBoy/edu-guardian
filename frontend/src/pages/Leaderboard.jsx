import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaMedal, FaCrown, FaStar, FaAward, FaFire } from 'react-icons/fa';
import { useStreak } from '../hooks/useStreak';

// Dummy user data
const dummyUsers = [
  { id: 1, name: 'Alex Johnson', xp: 1250, streak: 15, uploads: 8, badges: ['First Upload', '5-Day Streak', 'Math Master'] },
  { id: 2, name: 'Jamie Smith', xp: 980, streak: 7, uploads: 5, badges: ['First Upload', 'Science Pro', 'Consistent Learner'] },
  { id: 3, name: 'Taylor Brown', xp: 870, streak: 12, uploads: 6, badges: ['First Upload', '10-Day Streak'] },
  { id: 4, name: 'Morgan Lee', xp: 760, streak: 5, uploads: 4, badges: ['First Upload', 'History Buff'] },
  { id: 5, name: 'Riley Wilson', xp: 650, streak: 8, uploads: 3, badges: ['First Upload'] },
  { id: 6, name: 'You', xp: 0, streak: 0, uploads: 0, badges: [] }
];

const BadgeIcon = ({ badge }) => {
  // Map badge names to appropriate icons and colors
  const badgeConfig = {
    'First Upload': { icon: <FaAward />, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    '5-Day Streak': { icon: <FaFire />, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
    '10-Day Streak': { icon: <FaFire />, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    'Math Master': { icon: <FaStar />, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    'Science Pro': { icon: <FaStar />, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    'History Buff': { icon: <FaStar />, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' },
    'Consistent Learner': { icon: <FaAward />, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' }
  };

  const config = badgeConfig[badge] || { icon: <FaAward />, color: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} mr-2 mb-2`}>
      <span className="mr-1">{config.icon}</span>
      {badge}
    </span>
  );
};

const LeaderboardRow = ({ user, rank, isCurrentUser }) => {
  // Determine the rank icon
  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <FaTrophy className="text-yellow-500" />;
      case 2: return <FaMedal className="text-gray-400" />;
      case 3: return <FaMedal className="text-amber-700" />;
      default: return <span className="text-gray-500">{rank}</span>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.1 }}
      className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 mb-4 ${isCurrentUser ? 'border-2 border-primary' : ''}`}
    >
      <div className="flex items-center">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 text-xl font-bold mr-4">
          {getRankIcon(rank)}
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
            {user.name} 
            {rank === 1 && <FaCrown className="ml-2 text-yellow-500" />}
            {isCurrentUser && <span className="ml-2 text-sm font-normal text-primary dark:text-primary-light">(You)</span>}
          </h3>
          <div className="flex flex-wrap space-x-4 text-sm text-gray-600 dark:text-gray-300 mt-1">
            <span><strong>{user.xp}</strong> XP</span>
            <span><strong>{user.streak}</strong> day streak</span>
            <span><strong>{user.uploads}</strong> uploads</span>
          </div>
        </div>
        <div className="text-2xl font-bold text-primary dark:text-primary-light">
          #{rank}
        </div>
      </div>
      
      {user.badges.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap">
            {user.badges.map((badge, index) => (
              <BadgeIcon key={index} badge={badge} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const BadgeCard = ({ title, description, icon, color, unlocked }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 ${
      !unlocked ? 'opacity-50' : ''
    }`}
  >
    <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center mb-3 mx-auto`}>
      {icon}
    </div>
    <h3 className="text-center font-semibold text-gray-800 dark:text-gray-100 mb-1">{title}</h3>
    <p className="text-center text-sm text-gray-600 dark:text-gray-300">{description}</p>
    {!unlocked && (
      <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
        Locked
      </div>
    )}
  </motion.div>
);

const Leaderboard = () => {
  const { streak, xp } = useStreak();
  const [leaderboardData, setLeaderboardData] = useState([]);
  
  // Initialize leaderboard with current user's data
  useEffect(() => {
    // Get dummy data and add current user
    const userData = [...dummyUsers];
    
    // Update "You" entry with actual data
    const yourIndex = userData.findIndex(user => user.name === 'You');
    if (yourIndex !== -1) {
      userData[yourIndex] = {
        ...userData[yourIndex],
        xp,
        streak,
        // Determine badges based on streak and XP
        badges: [
          ...(xp >= 100 ? ['First Upload'] : []),
          ...(streak >= 5 ? ['5-Day Streak'] : []),
          ...(streak >= 10 ? ['10-Day Streak'] : []),
        ]
      };
    }
    
    // Sort by XP
    const sortedData = userData.sort((a, b) => b.xp - a.xp);
    setLeaderboardData(sortedData);
  }, [xp, streak]);
  
  // All possible badges
  const allBadges = [
    { 
      title: 'First Upload', 
      description: 'Upload your first note', 
      icon: <FaAward className="text-blue-600 dark:text-blue-400 text-xl" />,
      color: 'bg-blue-100 dark:bg-blue-900/30',
      unlocked: xp >= 100
    },
    { 
      title: '5-Day Streak', 
      description: 'Log in for 5 consecutive days', 
      icon: <FaFire className="text-orange-600 dark:text-orange-400 text-xl" />,
      color: 'bg-orange-100 dark:bg-orange-900/30',
      unlocked: streak >= 5
    },
    { 
      title: '10-Day Streak', 
      description: 'Log in for 10 consecutive days', 
      icon: <FaFire className="text-red-600 dark:text-red-400 text-xl" />,
      color: 'bg-red-100 dark:bg-red-900/30',
      unlocked: streak >= 10
    },
    { 
      title: 'Math Master', 
      description: 'Upload 5 math notes', 
      icon: <FaStar className="text-purple-600 dark:text-purple-400 text-xl" />,
      color: 'bg-purple-100 dark:bg-purple-900/30',
      unlocked: false
    },
    { 
      title: 'Science Pro', 
      description: 'Upload 5 science notes', 
      icon: <FaStar className="text-green-600 dark:text-green-400 text-xl" />,
      color: 'bg-green-100 dark:bg-green-900/30',
      unlocked: false
    },
    { 
      title: 'Consistent Learner', 
      description: 'View notes for 7 consecutive days', 
      icon: <FaAward className="text-indigo-600 dark:text-indigo-400 text-xl" />,
      color: 'bg-indigo-100 dark:bg-indigo-900/30',
      unlocked: false
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">Leaderboard</h1>
        <p className="text-gray-600 dark:text-gray-300">
          See how you rank among other students and earn achievements.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard Rankings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center">
              <FaTrophy className="text-yellow-500 mr-2" /> Top Contributors
            </h2>
            
            <div className="space-y-4">
              {leaderboardData.map((user, index) => (
                <LeaderboardRow 
                  key={user.id} 
                  user={user} 
                  rank={index + 1} 
                  isCurrentUser={user.name === 'You'} 
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Badges and Achievements */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center">
              <FaAward className="text-primary dark:text-primary-light mr-2" /> Your Badges
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              {allBadges.map((badge, index) => (
                <BadgeCard key={index} {...badge} />
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">How to earn more badges:</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>Upload notes regularly</li>
                <li>Maintain your daily streak</li>
                <li>Rate and review notes from others</li>
                <li>Complete your profile</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard; 