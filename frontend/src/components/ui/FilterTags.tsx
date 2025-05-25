import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaFilter } from 'react-icons/fa';
import Button from './Button'; // Use Button component for clear all

export interface Filters {
  subject?: string;
  grade?: string;
  semester?: string;
  quarter?: string;
  topic?: string;
  searchQuery?: string;
  [key: string]: string | undefined;
}

interface FilterTagsProps {
  filters: Filters;
  onRemoveFilter: (key: keyof Filters) => void;
  onClearAllFilters?: () => void; // Optional callback to clear all filters
}

const FilterTags: React.FC<FilterTagsProps> = ({ filters, onRemoveFilter, onClearAllFilters }) => {
  const activeFilters = Object.entries(filters).filter(([_, value]) => value && value !== '');
  
  // Helper function to format filter name (more robustly)
  const formatFilterName = (key: keyof Filters): string => {
    switch (key) {
      case 'grade': return 'Grade';
      case 'semester': return 'Semester';
      case 'quarter': return 'Quarter';
      case 'subject': return 'Subject';
      case 'topic': return 'Topic';
      default: 
        // Capitalize first letter for unknown keys
        return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };
  
  // Helper function to format filter value (more specific)
  const formatFilterValue = (key: keyof Filters, value: string): string => {
    if (key === 'grade' && value) return `Grade ${value}`;
    if (key === 'semester' && value) return `Semester ${value}`;
    if (key === 'quarter' && value) return `Q${value}`;
    return value; // Return value directly for subject, topic, etc.
  };
  
  // Don't render anything if no filters are active
  if (activeFilters.length === 0) return null;
  
  return (
    <div className="mb-5 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center text-gray-600 dark:text-gray-300 mb-3">
        <FaFilter className="mr-2 text-primary dark:text-primary-light" />
        <span className="text-sm font-medium">Filtering by:</span>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <AnimatePresence>
          {activeFilters.map(([key, value]) => (
            <motion.div
              key={key}
              layout // Animate layout changes when items are removed
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className="bg-primary/10 text-primary dark:bg-primary-light/10 dark:text-primary-light rounded-full px-3 py-1 flex items-center text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              {/* Keep structured representation: Name: Value */}
              <span className="mr-1">{formatFilterName(key as keyof Filters)}:</span>
              <span className="font-normal">{formatFilterValue(key as keyof Filters, value)}</span>
              
              {onRemoveFilter && (
                <button
                  onClick={() => onRemoveFilter(key as keyof Filters)}
                  className="ml-2 p-0.5 rounded-full text-primary/70 dark:text-primary-light/70 hover:text-primary dark:hover:text-primary-light hover:bg-primary/10 dark:hover:bg-primary-light/20 transition-colors"
                  aria-label={`Remove ${formatFilterName(key as keyof Filters)} filter`}
                >
                  <FaTimes size={10} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Clear All button - use the dedicated prop if available */}
        {activeFilters.length > 1 && onClearAllFilters && (
          <Button
            onClick={onClearAllFilters}
            className="btn-ghost btn-xs underline ml-2 text-gray-500 dark:text-gray-400"
            aria-label="Clear all filters"
          >
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterTags; 