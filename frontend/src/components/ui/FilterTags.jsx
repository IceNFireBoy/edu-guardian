import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaFilter } from 'react-icons/fa';

const FilterTags = ({ filters, onRemoveFilter }) => {
  // Filter out empty filter values
  const activeFilters = Object.entries(filters).filter(([_, value]) => value !== '');
  
  // Helper function to format filter name
  const formatFilterName = (key) => {
    const names = {
      grade: 'Grade',
      semester: 'Semester',
      quarter: 'Quarter',
      subject: 'Subject',
      topic: 'Topic'
    };
    return names[key] || key;
  };
  
  // Helper function to format filter value
  const formatFilterValue = (key, value) => {
    if (key === 'grade') return `Grade ${value}`;
    if (key === 'semester') return `Semester ${value}`;
    if (key === 'quarter') return `Q${value}`;
    return value;
  };
  
  if (activeFilters.length === 0) return null;
  
  return (
    <div className="mb-4">
      <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
        <FaFilter className="mr-2 text-primary dark:text-primary-light" />
        <span>Filtering by:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {activeFilters.map(([key, value]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-primary/10 text-primary dark:text-primary-light rounded-full px-3 py-1 flex items-center text-sm"
            >
              <span className="mr-1 font-medium">{formatFilterName(key)}:</span>
              <span>{formatFilterValue(key, value)}</span>
              
              {onRemoveFilter && (
                <button
                  onClick={() => onRemoveFilter(key)}
                  className="ml-2 text-primary dark:text-primary-light hover:text-primary-dark"
                  aria-label={`Remove ${formatFilterName(key)} filter`}
                >
                  <FaTimes size={10} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {activeFilters.length > 1 && onRemoveFilter && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline ml-2"
            onClick={() => {
              activeFilters.forEach(([key]) => {
                onRemoveFilter(key);
              });
            }}
          >
            Clear all
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default FilterTags; 