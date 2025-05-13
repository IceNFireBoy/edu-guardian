import React, { FC } from 'react';
import { motion } from 'framer-motion';
import { CircularProgressbar, buildStyles, CircularProgressbarStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { FaBook, FaClock } from 'react-icons/fa';

// --- Interfaces and Types ---

interface SubjectColorValue {
  bg: string;      // e.g., 'bg-red-500'
  light: string;   // e.g., 'bg-red-100'
  text: string;    // e.g., 'text-red-500'
  dark: string;    // e.g., 'dark:bg-red-900/30'
  darkText: string; // e.g., 'dark:text-red-400'
}

interface SubjectColors {
  [subject: string]: SubjectColorValue;
}

interface SubjectProgressData {
  completed: number;
  total: number;
}

interface EmojiStatsData {
  [emoji: string]: number;
  // Explicitly define expected emojis for better type safety if possible
  // '🤓': number;
  // '🤔': number;
  // '❗': number;
}

interface SubjectCardProps {
  subject: string;
  progress?: SubjectProgressData; // Make optional if data might be missing
  avgTime?: string; // Assuming avgTime is a pre-formatted string like "25 min"
  emojiStats?: EmojiStatsData;
}

interface AnimatedProgressRingProps {
  percentage: number;
  color: string; // Expecting a CSS variable or hex/rgb string
}

interface EmojiStatsBarProps {
  emojiStats?: EmojiStatsData;
}

// --- Color Definitions and Helper ---

const subjectColors: SubjectColors = {
  'Biology': { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-500', dark: 'dark:bg-red-900/30', darkText: 'dark:text-red-400' },
  'Business Mathematics': { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-500', dark: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400' },
  'Calculus': { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-500', dark: 'dark:bg-indigo-900/30', darkText: 'dark:text-indigo-400' },
  'Chemistry': { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-500', dark: 'dark:bg-green-900/30', darkText: 'dark:text-green-400' },
  'Computer': { bg: 'bg-cyan-500', light: 'bg-cyan-100', text: 'text-cyan-500', dark: 'dark:bg-cyan-900/30', darkText: 'dark:text-cyan-400' },
  'Creative Writing': { bg: 'bg-pink-500', light: 'bg-pink-100', text: 'text-pink-500', dark: 'dark:bg-pink-900/30', darkText: 'dark:text-pink-400' },
  'Disciplines in the Social Sciences': { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-500', dark: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-400' },
  'Drafting': { bg: 'bg-slate-500', light: 'bg-slate-100', text: 'text-slate-500', dark: 'dark:bg-slate-900/30', darkText: 'dark:text-slate-400' },
  'English': { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-500', dark: 'dark:bg-indigo-900/30', darkText: 'dark:text-indigo-400' },
  'Filipino': { bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-500', dark: 'dark:bg-yellow-900/30', darkText: 'dark:text-yellow-400' },
  'Fundamentals of Accounting': { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-500', dark: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-400' },
  'General Mathematics': { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-500', dark: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400' },
  'Introduction to World Religion': { bg: 'bg-violet-500', light: 'bg-violet-100', text: 'text-violet-500', dark: 'dark:bg-violet-900/30', darkText: 'dark:text-violet-400' },
  'Organization and Management': { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-500', dark: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-400' },
  'Photography': { bg: 'bg-sky-500', light: 'bg-sky-100', text: 'text-sky-500', dark: 'dark:bg-sky-900/30', darkText: 'dark:text-sky-400' },
  'Physics': { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-500', dark: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-400' },
  'Religion': { bg: 'bg-violet-500', light: 'bg-violet-100', text: 'text-violet-500', dark: 'dark:bg-violet-900/30', darkText: 'dark:text-violet-400' },
  'Research': { bg: 'bg-teal-500', light: 'bg-teal-100', text: 'text-teal-500', dark: 'dark:bg-teal-900/30', darkText: 'dark:text-teal-400' },
  'Science': { bg: 'bg-lime-500', light: 'bg-lime-100', text: 'text-lime-500', dark: 'dark:bg-lime-900/30', darkText: 'dark:text-lime-400' },
  'Social Science': { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-500', dark: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-400' },
  'Trends, Networks, and Critical Thinking': { bg: 'bg-fuchsia-500', light: 'bg-fuchsia-100', text: 'text-fuchsia-500', dark: 'dark:bg-fuchsia-900/30', darkText: 'dark:text-fuchsia-400' },
  'default': { bg: 'bg-gray-500', light: 'bg-gray-100', text: 'text-gray-500', dark: 'dark:bg-gray-700', darkText: 'dark:text-gray-400' }
};

const getSubjectColor = (subject: string): SubjectColorValue => {
  return subjectColors[subject] || subjectColors.default;
};

// --- Sub-Components ---

const AnimatedProgressRing: FC<AnimatedProgressRingProps> = ({ percentage, color }) => {
  const styles: Partial<CircularProgressbarStyles> = buildStyles({
    textSize: '22px',
    pathColor: color, // This should be a CSS color value, not a Tailwind class
    textColor: 'var(--color-text)', // Assumes CSS variable is set globally for text color
    trailColor: '#f3f4f6', // Example: light grey for trail
    pathTransition: 'stroke-dashoffset 0.5s ease 0s',
  });

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
        styles={styles}
      />
    </motion.div>
  );
};

const EmojiStatsBar: FC<EmojiStatsBarProps> = ({ emojiStats }) => {
  const defaultStats: EmojiStatsData = { "🤓": 0, "🤔": 0, "❗": 0 };
  const stats = emojiStats && Object.keys(emojiStats).length > 0 ? emojiStats : defaultStats;
  const total = Object.values(stats).reduce((sum, val) => sum + val, 0) || 1;
  
  return (
    <div className="mt-3">
      <div className="flex w-full h-3 rounded-full overflow-hidden">
        {Object.entries(stats).map(([emoji, value]) => {
          const percentage = (value / total) * 100 || 0;
          const width = `${percentage}%`;
          let bgColor = 'bg-green-400'; // Default color
          
          if (emoji === "🤓") bgColor = 'bg-green-400';
          else if (emoji === "🤔") bgColor = 'bg-yellow-400';
          else if (emoji === "❗") bgColor = 'bg-red-400';
          // Add more emoji-to-color mappings if needed
          
          return (
            <div 
              key={emoji} 
              className={`${bgColor}`} 
              style={{ width }}
              title={`${emoji}: ${Math.round(percentage)}%`}
            />
          );
        })}
      </div>
      
      <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
        {Object.entries(stats).map(([emoji, value]) => {
          const percentage = (value / total) * 100 || 0;
          return (
            <div key={emoji} className="flex items-center">
              <span className="mr-1">{emoji}</span>
              <span>{Math.round(percentage)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Main Component ---

const SubjectCard: FC<SubjectCardProps> = ({ subject, progress, avgTime, emojiStats }) => {
  const colorTheme = getSubjectColor(subject);
  const percentage = progress && progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  
  // Determine the actual color value for the progress ring path
  // This is a simplified way; ideally, map Tailwind classes to actual hex/rgb values or use CSS variables directly
  let ringPathColor = '#4f46e5'; // Default indigo
  if (colorTheme.text === 'text-red-500') ringPathColor = '#ef4444';
  else if (colorTheme.text === 'text-blue-500') ringPathColor = '#3b82f6';
  else if (colorTheme.text === 'text-indigo-500') ringPathColor = '#6366f1';
  else if (colorTheme.text === 'text-green-500') ringPathColor = '#22c55e';
  else if (colorTheme.text === 'text-cyan-500') ringPathColor = '#06b6d4';
  else if (colorTheme.text === 'text-pink-500') ringPathColor = '#ec4899';
  else if (colorTheme.text === 'text-orange-500') ringPathColor = '#f97316';
  // ... add other mappings from colorTheme.text to hex/rgb for CircularProgressbar pathColor

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Progress Card */}
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md flex-1"
      >
        <div className="flex items-start">
          <AnimatedProgressRing percentage={percentage} color={ringPathColor} />
          
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
                initial={{ width: '0%' }} // Ensure width is a string with %
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-2 rounded-full ${colorTheme.bg}`}
              />
            </div>
          </div>
        </div>
        
        {avgTime && (
          <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FaClock className="mr-2" />
            <span>Average study time: {avgTime}</span>
          </div>
        )}
        
        {emojiStats && <EmojiStatsBar emojiStats={emojiStats} />}
      </motion.div>
    </div>
  );
};

export default SubjectCard; 