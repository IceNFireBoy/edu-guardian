import React from 'react';
import { motion } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { FaBook, FaClock } from 'react-icons/fa';

// Mapping of subjects to colors
const subjectColors = {
  'Mathematics': { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-500', dark: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400' },
  'Physics': { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-500', dark: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-400' },
  'Chemistry': { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-500', dark: 'dark:bg-green-900/30', darkText: 'dark:text-green-400' },
  'Biology': { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-500', dark: 'dark:bg-red-900/30', darkText: 'dark:text-red-400' },
  'History': { bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-500', dark: 'dark:bg-yellow-900/30', darkText: 'dark:text-yellow-400' },
  'English': { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-500', dark: 'dark:bg-indigo-900/30', darkText: 'dark:text-indigo-400' },
  'Geography': { bg: 'bg-teal-500', light: 'bg-teal-100', text: 'text-teal-500', dark: 'dark:bg-teal-900/30', darkText: 'dark:text-teal-400' },
  'Computer Science': { bg: 'bg-cyan-500', light: 'bg-cyan-100', text: 'text-cyan-500', dark: 'dark:bg-cyan-900/30', darkText: 'dark:text-cyan-400' },
  'Economics': { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-500', dark: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-400' },
  'default': { bg: 'bg-gray-500', light: 'bg-gray-100', text: 'text-gray-500', dark: 'dark:bg-gray-700', darkText: 'dark:text-gray-400' }
};

// Helper to get color theme based on subject
const getSubjectColor = (subject) => {
  return subjectColors[subject] || subjectColors.default;
};

// Progress Ring component with animation
const AnimatedProgressRing = ({ percentage, color }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-20 h-20"
    >
      <CircularProgressbar
        value={percentage}
        text={`${percentage}%`}
        styles={buildStyles({
          textSize: '22px',
          pathColor: color,
          textColor: 'var(--color-text)',
          trailColor: '#f3f4f6',
          pathTransition: 'stroke-dashoffset 0.5s ease 0s',
        })}
      />
    </motion.div>
  );
};

// Emoji Stats Bar component
const EmojiStatsBar = ({ emojiStats }) => {
  // Ensure we have valid emoji stats
  const stats = emojiStats || { "🤓": 0, "🤔": 0, "❗": 0 };
  const total = Object.values(stats).reduce((sum, val) => sum + val, 0) || 1; // Avoid division by zero
  
  return (
    <div className="mt-3">
      <div className="flex w-full h-3 rounded-full overflow-hidden">
        {Object.entries(stats).map(([emoji, value]) => {
          const width = `${(value / total) * 100}%`;
          let bgColor = 'bg-green-400';
          
          // Map emojis to colors
          if (emoji === "🤓") bgColor = 'bg-green-400';
          else if (emoji === "🤔") bgColor = 'bg-yellow-400';
          else if (emoji === "❗") bgColor = 'bg-red-400';
          
          return (
            <div 
              key={emoji} 
              className={`${bgColor}`} 
              style={{ width }}
              title={`${emoji}: ${Math.round((value / total) * 100)}%`}
            />
          );
        })}
      </div>
      
      <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
        {Object.entries(stats).map(([emoji, value]) => (
          <div key={emoji} className="flex items-center">
            <span className="mr-1">{emoji}</span>
            <span>{Math.round((value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * SubjectCard component displays study progress and engagement insights
 */
const SubjectCard = ({ subject, progress, avgTime, emojiStats }) => {
  const colorTheme = getSubjectColor(subject);
  const percentage = progress ? Math.round((progress.completed / progress.total) * 100) : 0;
  
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Progress Card */}
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md flex-1"
      >
        <div className="flex items-start">
          <AnimatedProgressRing percentage={percentage} color={`var(--${colorTheme.text.replace('text-', '')})`} />
          
          <div className="ml-4 flex-1">
            <div className="flex items-center mb-2">
              <span className={`p-2 rounded-full ${colorTheme.light} ${colorTheme.dark} mr-2`}>
                <FaBook className={`${colorTheme.text} ${colorTheme.darkText}`} size={16} />
              </span>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{subject}</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              {progress?.completed || 0} out of {progress?.total || 0} completed
            </p>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-2 rounded-full ${colorTheme.bg}`}
              />
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Engagement Insights Card */}
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md flex-1"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Engagement Insights</h3>
        
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <FaClock className="text-gray-500 mr-2" />
            <span className="text-gray-700 dark:text-gray-300">Average Time</span>
          </div>
          <p className="text-2xl font-bold ml-7 text-gray-800 dark:text-gray-100">{avgTime}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Understanding</h4>
          <EmojiStatsBar emojiStats={emojiStats} />
        </div>
      </motion.div>
    </div>
  );
};

export default SubjectCard; 