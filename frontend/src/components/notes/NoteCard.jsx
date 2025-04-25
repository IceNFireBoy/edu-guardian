import React from 'react';
import { motion } from 'framer-motion';
import { FaBookOpen, FaFilePdf, FaImage } from 'react-icons/fa';
import StarRating from './StarRating';
import { useStreak } from '../../hooks/useStreak';

// Helper function to get average rating from localStorage
const getAverageRating = (noteId) => {
  try {
    const ratingsData = localStorage.getItem('note_ratings') || '{}';
    const ratings = JSON.parse(ratingsData);
    return ratings[noteId] || 0;
  } catch (e) {
    console.error('Error getting average rating:', e);
    return 0;
  }
};

const NoteCard = ({ note, onView, compact = false }) => {
  const { recordActivity } = useStreak();
  const averageRating = getAverageRating(note.asset_id || note._id);
  
  const handleView = () => {
    // Record the view activity for XP
    recordActivity('VIEW_NOTE');
    
    // Call the parent handler
    if (onView) onView(note);
  };
  
  // Get appropriate icon based on file type
  const getIcon = () => {
    if (note.resource_type === 'image' || note.fileType === 'image') {
      return <FaImage className="text-4xl text-blue-400 dark:text-blue-500" />;
    } else if (note.fileType === 'pdf' || note.resource_type === 'raw') {
      return <FaFilePdf className="text-4xl text-red-400 dark:text-red-500" />;
    } else {
      return <FaBookOpen className="text-4xl text-gray-400 dark:text-gray-500" />;
    }
  };
  
  // Get title from note
  const getTitle = () => {
    return note.title || note.context?.caption || 'Untitled Note';
  };
  
  // Get description from note
  const getDescription = () => {
    return note.description || note.context?.alt || 'No description available';
  };
  
  // Get image url
  const getImageUrl = () => {
    return note.fileUrl || note.secure_url || '';
  };
  
  // Extract and format tags
  const getTags = () => {
    const tags = note.tags || [];
    return tags.map(tag => {
      // Handle both string tags and processed tags
      const tagValue = typeof tag === 'string' 
        ? tag.replace(/_/g, ' ').replace(/^(grade|sem|quarter|subject|topic)_/, '')
        : tag;
      return tagValue;
    });
  };

  // Compact view for grid layouts
  if (compact) {
    return (
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden h-full flex flex-col"
      >
        <div className="h-32 overflow-hidden bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
          {note.resource_type === 'image' || note.fileType === 'image' ? (
            <img 
              src={getImageUrl()} 
              alt={getTitle()} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {getIcon()}
            </div>
          )}
        </div>
        
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1 line-clamp-1">
            {getTitle()}
          </h3>
          
          <div className="mt-auto flex justify-between items-center">
            <button
              onClick={handleView}
              className="text-primary dark:text-primary-light hover:text-primary-dark text-sm font-medium flex items-center"
            >
              View
            </button>
            
            <StarRating noteId={note.asset_id || note._id} size="small" readOnly={true} initialRating={averageRating} />
          </div>
        </div>
      </motion.div>
    );
  }

  // Standard card view
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden"
    >
      <div className="h-40 overflow-hidden bg-gray-100 dark:bg-slate-700">
        {note.resource_type === 'image' || note.fileType === 'image' ? (
          <img 
            src={getImageUrl()} 
            alt={getTitle()} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {getIcon()}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 text-gray-800 dark:text-gray-100">
          {getTitle()}
        </h3>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {getTags().map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-primary/10 text-primary dark:text-primary-light text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {getDescription()}
        </p>
        
        <div className="flex justify-between items-center">
          <button
            onClick={handleView}
            className="text-primary dark:text-primary-light hover:text-primary-dark text-sm font-medium flex items-center"
            aria-label={`View note: ${getTitle()}`}
          >
            <FaBookOpen className="mr-1" /> View Note
          </button>
          
          <div className="flex items-center">
            <StarRating noteId={note.asset_id || note._id} size="small" readOnly={true} initialRating={averageRating} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NoteCard; 