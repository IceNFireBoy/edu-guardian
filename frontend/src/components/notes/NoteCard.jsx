import React from 'react';
import { motion } from 'framer-motion';
import { FaBookOpen, FaFilePdf, FaImage, FaFileAlt, FaExclamationCircle } from 'react-icons/fa';
import StarRating from './StarRating';
import { useStreak } from '../../hooks/useStreak';

// Helper function to get average rating from localStorage
const getAverageRating = (noteId) => {
  try {
    if (!noteId) return 0;
    const ratingsData = localStorage.getItem('note_ratings') || '{}';
    const ratings = JSON.parse(ratingsData);
    return ratings[noteId] || 0;
  } catch (e) {
    console.error('Error getting average rating:', e);
    return 0;
  }
};

// Fallback for invalid notes
const InvalidNoteCard = ({ error, compact = false }) => {
  return (
    <div className={`bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md overflow-hidden border border-red-200 dark:border-red-800 ${compact ? 'h-full flex flex-col' : ''}`}>
      <div className={`${compact ? 'h-32' : 'h-40'} flex items-center justify-center bg-red-100 dark:bg-red-900/30`}>
        <FaExclamationCircle className="text-4xl text-red-400 dark:text-red-500" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 text-red-800 dark:text-red-300">
          Invalid Note
        </h3>
        <p className="text-red-600 dark:text-red-400 text-sm">
          {error || "This note has invalid or missing data"}
        </p>
      </div>
    </div>
  );
};

const NoteCard = ({ note, onView, compact = false }) => {
  // Handle invalid note prop
  if (!note || typeof note !== 'object') {
    console.error("NoteCard received invalid note prop:", note);
    return <InvalidNoteCard error="Missing note data" compact={compact} />;
  }
  
  const { recordActivity } = useStreak();
  const noteId = note.asset_id || note._id || `note-${Math.random()}`;
  const averageRating = getAverageRating(noteId);
  
  const handleView = () => {
    try {
      // Record the view activity for XP
      if (recordActivity && typeof recordActivity === 'function') {
        recordActivity('VIEW_NOTE');
      }
      
      // Call the parent handler
      if (onView && typeof onView === 'function') {
        onView(note);
      }
    } catch (err) {
      console.error("Error handling note view:", err);
    }
  };
  
  // Get appropriate icon based on file type
  const getIcon = () => {
    try {
      if (note.resource_type === 'image' || note.fileType === 'image') {
        return <FaImage className="text-4xl text-blue-400 dark:text-blue-500" />;
      } else if (note.fileType === 'pdf' || note.format === 'pdf' || note.resource_type === 'raw') {
        return <FaFilePdf className="text-4xl text-red-400 dark:text-red-500" />;
      } else if (note.fileType || note.format) {
        return <FaFileAlt className="text-4xl text-green-400 dark:text-green-500" />;
      } else {
        return <FaBookOpen className="text-4xl text-gray-400 dark:text-gray-500" />;
      }
    } catch (err) {
      console.error("Error getting note icon:", err);
      return <FaFileAlt className="text-4xl text-gray-400 dark:text-gray-500" />;
    }
  };
  
  // Get title from note
  const getTitle = () => {
    try {
      return note.title || 
        (note.context && note.context.caption) || 
        note.public_id?.split('/').pop() || 
        'Untitled Note';
    } catch (err) {
      console.error("Error getting note title:", err);
      return 'Untitled Note';
    }
  };
  
  // Get description from note
  const getDescription = () => {
    try {
      return note.description || 
        (note.context && note.context.alt) || 
        'No description available';
    } catch (err) {
      console.error("Error getting note description:", err);
      return 'No description available';
    }
  };
  
  // Get image url
  const getImageUrl = () => {
    try {
      return note.fileUrl || 
        note.secure_url || 
        (note.resource_type === 'image' ? 'https://via.placeholder.com/400x300?text=Image+Not+Available' : '');
    } catch (err) {
      console.error("Error getting image URL:", err);
      return 'https://via.placeholder.com/400x300?text=Error+Loading+Image';
    }
  };
  
  // Extract and format tags
  const getTags = () => {
    try {
      const tags = note.tags || [];
      if (!Array.isArray(tags)) return [];
      
      return tags.map(tag => {
        if (!tag) return '';
        // Handle both string tags and processed tags
        const tagValue = typeof tag === 'string' 
          ? tag.replace(/_/g, ' ').replace(/^(grade|sem|quarter|subject|topic)_/, '')
          : String(tag);
        return tagValue;
      }).filter(tag => tag); // Filter out empty tags
    } catch (err) {
      console.error("Error processing note tags:", err);
      return [];
    }
  };

  // Render the component in a try/catch block to prevent rendering errors
  try {
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
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                }}
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
              
              <StarRating noteId={noteId} size="small" readOnly={true} initialRating={averageRating} />
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
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
              }}
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
          
          {getTags().length > 0 && (
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
          )}
          
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
              <StarRating noteId={noteId} size="small" readOnly={true} initialRating={averageRating} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  } catch (renderError) {
    console.error("Error rendering NoteCard:", renderError, note);
    return <InvalidNoteCard error="Error rendering note" compact={compact} />;
  }
};

export default NoteCard; 