import React from 'react';
import { motion } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { FaTrophy, FaFire, FaStar, FaBook, FaCalendarAlt } from 'react-icons/fa';
import { useStreak } from '../hooks/useStreak';

// Progress Card component
const ProgressCard = ({ title, value, total, color, icon }) => {
  const percentage = Math.round((value / total) * 100);
  
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md"
    >
      <div className="flex items-start">
        <div className="w-24 h-24 mr-4 flex-shrink-0">
          <CircularProgressbar
            value={percentage}
            text={`${percentage}%`}
            styles={buildStyles({
              textSize: '22px',
              pathColor: color,
              textColor: 'var(--color-text)',
              trailColor: '#f3f4f6',
            })}
          />
        </div>
        
        <div className="flex-grow">
          <div className="flex items-center mb-1">
            <span className={`p-2 rounded-full ${color.replace('text', 'bg')}/10 mr-2`}>
              {icon}
            </span>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            {value} out of {total} completed
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${color.replace('text', 'bg')}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Stats Card component
const StatsCard = ({ title, value, icon, color }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-center"
  >
    <div className={`p-3 rounded-full ${color.replace('text', 'bg')}/10 mr-3`}>
      {icon}
    </div>
    <div>
      <h3 className="text-gray-500 dark:text-gray-400 text-sm">{title}</h3>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  </motion.div>
);

// Subject Progress component
const SubjectProgress = ({ subject, topics, completedTopics, color }) => {
  const percentage = Math.round((completedTopics / topics) * 100);
  
  return (
    <div className="flex items-center mb-4">
      <div className="w-16 h-16 mr-4">
        <CircularProgressbar
          value={percentage}
          text={`${percentage}%`}
          styles={buildStyles({
            textSize: '26px',
            pathColor: color,
            textColor: 'var(--color-text)',
            trailColor: '#f3f4f6',
          })}
        />
      </div>
      <div className="flex-grow">
        <h4 className="font-medium text-gray-800 dark:text-gray-100">{subject}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {completedTopics} of {topics} topics completed
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
          <div
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const Progress = () => {
  const { streak, xp } = useStreak();
  
  // Dummy progress data - in a real app, this would come from a database
  const progressData = [
    { title: 'Mathematics', value: 8, total: 12, color: 'text-blue-500', icon: <FaBook className="text-blue-500" size={16} /> },
    { title: 'Physics', value: 5, total: 10, color: 'text-purple-500', icon: <FaBook className="text-purple-500" size={16} /> },
    { title: 'Chemistry', value: 3, total: 8, color: 'text-green-500', icon: <FaBook className="text-green-500" size={16} /> },
    { title: 'Biology', value: 7, total: 9, color: 'text-red-500', icon: <FaBook className="text-red-500" size={16} /> }
  ];
  
  // Subject progress for detailed breakdown
  const subjectsProgress = [
    { subject: 'Mathematics', topics: 12, completedTopics: 8, color: 'bg-blue-500' },
    { subject: 'Physics', topics: 10, completedTopics: 5, color: 'bg-purple-500' },
    { subject: 'Chemistry', topics: 8, completedTopics: 3, color: 'bg-green-500' },
    { subject: 'Biology', topics: 9, completedTopics: 7, color: 'bg-red-500' },
    { subject: 'History', topics: 7, completedTopics: 4, color: 'bg-yellow-500' },
    { subject: 'English', topics: 6, completedTopics: 5, color: 'bg-indigo-500' }
  ];
  
  // Stats data
  const statsData = [
    { title: 'Current Streak', value: `${streak} days`, icon: <FaFire className="text-orange-500" size={20} />, color: 'text-orange-500' },
    { title: 'XP Points', value: xp, icon: <FaStar className="text-yellow-500" size={20} />, color: 'text-yellow-500' },
    { title: 'Total Notes Viewed', value: '23', icon: <FaBook className="text-green-500" size={20} />, color: 'text-green-500' },
    { title: 'Days Active', value: '15', icon: <FaCalendarAlt className="text-blue-500" size={20} />, color: 'text-blue-500' }
  ];
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">Progress Tracker</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Track your learning journey and academic progress.
        </p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsData.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>
      
      {/* Progress Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Subject Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {progressData.map((progress, index) => (
            <ProgressCard key={index} {...progress} />
          ))}
        </div>
      </div>
      
      {/* Detailed Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <FaTrophy className="text-yellow-500 mr-2" size={20} />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Detailed Breakdown</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {subjectsProgress.map((subject, index) => (
            <SubjectProgress key={index} {...subject} />
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300 mb-2">Study Recommendation</h3>
          <p className="text-blue-600 dark:text-blue-300">
            Based on your progress, consider focusing more on Chemistry to improve your understanding.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Progress; 