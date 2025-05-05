import React from 'react';
import { motion } from 'framer-motion';

// Get the same subject colors as in SubjectCard for consistency
const subjectColors = {
  'Mathematics': { bg: 'bg-blue-400' },
  'Physics': { bg: 'bg-purple-400' },
  'Chemistry': { bg: 'bg-green-400' },
  'Biology': { bg: 'bg-red-400' },
  'History': { bg: 'bg-yellow-400' },
  'English': { bg: 'bg-indigo-400' },
  'Geography': { bg: 'bg-teal-400' },
  'Computer Science': { bg: 'bg-cyan-400' },
  'Economics': { bg: 'bg-orange-400' },
  'default': { bg: 'bg-gray-400' }
};

/**
 * Component that visualizes the percentage of time spent per subject
 */
const FocusBar = ({ subjectTimeData }) => {
  // If no data is provided, return placeholder
  if (!subjectTimeData || Object.keys(subjectTimeData).length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Focus Distribution</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-3">
          Complete some studies to see your focus distribution.
        </p>
        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    );
  }
  
  // Calculate total time
  const totalTime = Object.values(subjectTimeData).reduce((sum, time) => sum + time, 0);
  
  // If total time is 0, return placeholder
  if (totalTime === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Focus Distribution</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-3">
          No time data available yet. Complete some studies to see your focus distribution.
        </p>
        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    );
  }
  
  // Convert data to sorted array of objects
  const focusData = Object.entries(subjectTimeData)
    .map(([subject, time]) => ({
      subject,
      time,
      percentage: (time / totalTime) * 100,
      color: subjectColors[subject]?.bg || subjectColors.default.bg
    }))
    .filter(item => item.percentage > 0) // Only show subjects with time > 0
    .sort((a, b) => b.time - a.time); // Sort by time in descending order
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Focus Distribution</h2>
      
      <div className="flex w-full h-4 rounded-full overflow-hidden mb-3">
        {focusData.map((item, index) => (
          <motion.div
            key={index}
            className={`${item.color}`}
            style={{ width: `${item.percentage}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${item.percentage}%` }}
            transition={{ duration: 1, delay: index * 0.1 }}
            title={`${item.subject}: ${Math.round(item.percentage)}%`}
          />
        ))}
      </div>
      
      <div className="flex flex-wrap gap-3 mt-2">
        {focusData.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${item.color} mr-1`}></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {item.subject}: {Math.round(item.percentage)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FocusBar; 