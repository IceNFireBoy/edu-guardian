import React from 'react';
import { motion } from 'framer-motion';
import { FaChartBar, FaInfoCircle } from 'react-icons/fa';

// --- Types & Interfaces ---

// Type for the input data: subject name -> time spent (e.g., minutes)
export interface SubjectTimeData {
  [subject: string]: number;
}

interface FocusBarProps {
  subjectTimeData: SubjectTimeData | null | undefined;
}

interface FocusItem {
  subject: string;
  time: number;
  percentage: number;
  colorClass: string; // Tailwind background color class
}

// --- Subject Colors (Consider moving to a shared constants/utils file if used elsewhere) ---

interface SubjectColorMap {
  [subject: string]: {
    bg: string; // e.g., 'bg-blue-500'
    text?: string; // e.g., 'text-blue-100' for contrast on dark bg
    border?: string; // e.g., 'border-blue-700'
  };
}

const subjectColors: SubjectColorMap = {
  'Mathematics': { bg: 'bg-blue-500', text: 'text-blue-50' },
  'Physics': { bg: 'bg-purple-500', text: 'text-purple-50' },
  'Chemistry': { bg: 'bg-green-500', text: 'text-green-50' },
  'Biology': { bg: 'bg-red-500', text: 'text-red-50' },
  'History': { bg: 'bg-yellow-500', text: 'text-yellow-50' },
  'English': { bg: 'bg-indigo-500', text: 'text-indigo-50' },
  'Geography': { bg: 'bg-teal-500', text: 'text-teal-50' },
  'Computer Science': { bg: 'bg-cyan-500', text: 'text-cyan-50' },
  'Economics': { bg: 'bg-orange-500', text: 'text-orange-50' },
  'Art': { bg: 'bg-pink-500', text: 'text-pink-50' },
  'Music': { bg: 'bg-lime-500', text: 'text-lime-50' },
  'Languages': { bg: 'bg-amber-500', text: 'text-amber-50' },
  'Default': { bg: 'bg-gray-500', text: 'text-gray-50' }, // Renamed for clarity
};

const getSubjectColor = (subject: string): string => {
    return subjectColors[subject]?.bg || subjectColors.Default.bg;
}

// --- FocusBar Component ---

const FocusBar: React.FC<FocusBarProps> = ({ subjectTimeData }) => {
  if (!subjectTimeData || Object.keys(subjectTimeData).length === 0) {
    return (
      <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200 flex items-center">
          <FaChartBar className="mr-2 text-primary" /> Focus Distribution
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center">
          <FaInfoCircle className="mr-2 text-gray-400" />
          Complete study sessions to see how your focus is distributed across subjects.
        </p>
        <div className="w-full h-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    );
  }

  const totalTime = Object.values(subjectTimeData).reduce((sum, time) => sum + (time || 0), 0);

  if (totalTime === 0) {
    return (
      <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200 flex items-center">
           <FaChartBar className="mr-2 text-primary" /> Focus Distribution
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          No study time recorded yet for any subject. Complete some studies to see your focus distribution.
        </p>
        <div className="w-full h-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    );
  }

  const focusData: FocusItem[] = Object.entries(subjectTimeData)
    .map(([subject, time]) => ({
      subject,
      time: time || 0,
      percentage: totalTime > 0 ? ((time || 0) / totalTime) * 100 : 0,
      colorClass: getSubjectColor(subject),
    }))
    .filter(item => item.percentage > 0.1) // Only show items with meaningful percentage
    .sort((a, b) => b.time - a.time); // Sort by time descending

  return (
    <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
        <FaChartBar className="mr-2 text-primary" /> Focus Distribution
      </h2>
      
      {/* Bar itself */}
      <div className="flex w-full h-5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4 shadow-inner">
        {focusData.map((item, index) => (
          <motion.div
            key={item.subject} // Use subject as key assuming unique
            className={`${item.colorClass}`}
            style={{ width: `${item.percentage}%` }}
            initial={{ opacity: 0, width: '0%' }}
            animate={{ opacity: 1, width: `${item.percentage}%` }}
            transition={{ duration: 0.6, delay: index * 0.05, ease: "easeOut" }}
            title={`${item.subject}: ${item.percentage.toFixed(1)}% (${item.time} min)`}
            aria-label={`${item.subject}, ${item.percentage.toFixed(1)}% of focus time`}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 mt-3">
        {focusData.map((item) => (
          <div key={item.subject} className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${item.colorClass} mr-2 flex-shrink-0`}></div>
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate" title={item.subject}>
              {item.subject}
            </span>
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {item.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FocusBar; 