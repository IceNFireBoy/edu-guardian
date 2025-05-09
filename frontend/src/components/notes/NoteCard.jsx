import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBookOpen, FaFilePdf, FaImage, FaFileAlt, FaExclamationCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating';
import { useStreak } from '../../hooks/useStreak';
import PDFThumbnail from './PDFThumbnail';
import EnhancedPDFIcon from './EnhancedPDFIcon';

// Subject color mapping - matches the one in SubjectCard.jsx
export const subjectColors = {
  'Biology': { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-500', dark: 'dark:bg-red-900/30', darkText: 'dark:text-red-400' },
  'Business Mathematics': { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-500', dark: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400' },
  'Calculus': { bg: 'bg-cyan-500', light: 'bg-cyan-100', text: 'text-cyan-500', dark: 'dark:bg-cyan-900/30', darkText: 'dark:text-cyan-400' },
  'Chemistry': { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-500', dark: 'dark:bg-green-900/30', darkText: 'dark:text-green-400' },
  'Computer': { bg: 'bg-slate-500', light: 'bg-slate-100', text: 'text-slate-500', dark: 'dark:bg-slate-900/30', darkText: 'dark:text-slate-400' },
  'Creative Writing': { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-500', dark: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-400' },
  'Disciplines in the Social Sciences': { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-500', dark: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-400' },
  'Drafting': { bg: 'bg-neutral-500', light: 'bg-neutral-100', text: 'text-neutral-500', dark: 'dark:bg-neutral-900/30', darkText: 'dark:text-neutral-400' },
  'English': { bg: 'bg-sky-500', light: 'bg-sky-100', text: 'text-sky-500', dark: 'dark:bg-sky-900/30', darkText: 'dark:text-sky-400' },
  'Filipino': { bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-500', dark: 'dark:bg-yellow-900/30', darkText: 'dark:text-yellow-400' },
  'Fundamentals of Accounting': { bg: 'bg-zinc-500', light: 'bg-zinc-100', text: 'text-zinc-500', dark: 'dark:bg-zinc-900/30', darkText: 'dark:text-zinc-400' },
  'General Mathematics': { bg: 'bg-violet-500', light: 'bg-violet-100', text: 'text-violet-500', dark: 'dark:bg-violet-900/30', darkText: 'dark:text-violet-400' },
  'Introduction to World Religion': { bg: 'bg-stone-500', light: 'bg-stone-100', text: 'text-stone-500', dark: 'dark:bg-stone-900/30', darkText: 'dark:text-stone-400' },
  'Organization and Management': { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-500', dark: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-400' },
  'Photography': { bg: 'bg-rose-500', light: 'bg-rose-100', text: 'text-rose-500', dark: 'dark:bg-rose-900/30', darkText: 'dark:text-rose-400' },
  'Physics': { bg: 'bg-fuchsia-500', light: 'bg-fuchsia-100', text: 'text-fuchsia-500', dark: 'dark:bg-fuchsia-900/30', darkText: 'dark:text-fuchsia-400' },
  'Religion': { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-500', dark: 'dark:bg-indigo-900/30', darkText: 'dark:text-indigo-400' },
  'Research': { bg: 'bg-teal-500', light: 'bg-teal-100', text: 'text-teal-500', dark: 'dark:bg-teal-900/30', darkText: 'dark:text-teal-400' },
  'Science': { bg: 'bg-lime-500', light: 'bg-lime-100', text: 'text-lime-500', dark: 'dark:bg-lime-900/30', darkText: 'dark:text-lime-400' },
  'Social Science': { bg: 'bg-pink-500', light: 'bg-pink-100', text: 'text-pink-500', dark: 'dark:bg-pink-900/30', darkText: 'dark:text-pink-400' },
  'Trends, Networks, and Critical Thinking': { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-500', dark: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-400' },
  'default': { bg: 'bg-gray-500', light: 'bg-gray-100', text: 'text-gray-500', dark: 'dark:bg-gray-700', darkText: 'dark:text-gray-400' }
};

// Helper to get color theme based on subject
export const getSubjectColor = (subject) => {
  return subjectColors[subject] || subjectColors.default;
};

// Determine if we're in production mode
const isProduction = import.meta.env.PROD || window.location.hostname === 'eduguardian.netlify.app';

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

const getRatingStats = (noteId) => {
  try {
    const ratingsData = localStorage.getItem('note_ratings') || '{}';
    const ratings = JSON.parse(ratingsData);
    const allRatings = ratings[noteId] ? (Array.isArray(ratings[noteId]) ? ratings[noteId] : [ratings[noteId]]) : [];
    if (!allRatings.length) return { avg: 0, count: 0 };
    const sum = allRatings.reduce((a, b) => a + b, 0);
    return { avg: sum / allRatings.length, count: allRatings.length };
  } catch {
    return { avg: 0, count: 0 };
  }
};

const NoteCard = ({ note, onView, compact = false }) => {
  // Handle invalid note prop
  if (!note || typeof note !== 'object') {
    console.error("NoteCard received invalid note prop:", note);
    return <InvalidNoteCard error="Missing note data" compact={compact} />;
  }
  
  const { recordActivity } = useStreak();
  const navigate = useNavigate();
  const noteId = note.asset_id || note._id || `note-${Math.random()}`;
  const { avg: averageRating, count: ratingCount } = getRatingStats(noteId);
  
  const handleView = () => {
    try {
      // Record the view activity for XP
      if (recordActivity && typeof recordActivity === 'function') {
        recordActivity('VIEW_NOTE');
      }
      
      // Navigate to the note viewer page
      navigate(`/view-note?id=${noteId}`);
      
      // Also call the parent handler if provided (for backward compatibility)
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
      // Debug log to see what's happening with the description
      const description = note.description || 
        (note.context && note.context.alt) || 
        'No description available';
      
      console.log('Note description debug:', { 
        noteId: note._id || note.asset_id,
        rawDescription: note.description,
        contextAlt: note.context?.alt,
        finalDescription: description
      });
      
      return description;
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

  // Check if the note is a PDF
  const isPDF = () => {
    return note.fileType === 'pdf' || note.format === 'pdf' || 
           (note.resource_type === 'raw' && note.secure_url?.toLowerCase().endsWith('.pdf'));
  };

  // For PDF thumbnails with a fallback to icon
  const [pdfThumbnailFailed, setPdfThumbnailFailed] = useState(true); // Default to failed in production
  
  // Set pdfThumbnailFailed to false initially in development environment
  useEffect(() => {
    if (!isProduction) {
      setPdfThumbnailFailed(false);
    }
  }, []);
  
  const renderPDFThumbnail = () => {
    // If we're in production or PDF rendering failed, use enhanced PDF icon instead
    if (isProduction || pdfThumbnailFailed) {
      return (
        <EnhancedPDFIcon note={note} className="w-full h-full" />
      );
    }
    
    // Only try to render PDF thumbnails in development environment
    return (
      <PDFThumbnail 
        url={getImageUrl()} 
        alt={getTitle()} 
        className="w-full h-full"
        onError={() => setPdfThumbnailFailed(true)}
      />
    );
  };

  // Render the component in a try/catch block to prevent rendering errors
  try {
    // Compact view for grid layouts
    if (compact) {
      return (
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden h-full flex flex-col"
          style={{ borderLeft: `4px solid var(--${getSubjectColor(note.subject).text.replace('text-', '')})` }}
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
            ) : isPDF() ? (
              renderPDFThumbnail()
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
            
            {/* Subject and Topic tags */}
            <div className="mb-auto flex flex-wrap gap-1">
              {note.subject && (
                <span className={`inline-block px-2 py-0.5 text-xs ${getSubjectColor(note.subject).light} ${getSubjectColor(note.subject).text} ${getSubjectColor(note.subject).dark} ${getSubjectColor(note.subject).darkText} rounded-full`}>
                  {note.subject}
                </span>
              )}
              {note.topic && (
                <span className="inline-block px-2 py-0.5 text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full">
                  {note.topic}
                </span>
              )}
            </div>
            
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
        style={{ borderTop: `4px solid var(--${getSubjectColor(note.subject).text.replace('text-', '')})` }}
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
          ) : isPDF() ? (
            renderPDFThumbnail()
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {getIcon()}
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1 line-clamp-1">
            {getTitle()}
          </h3>
          
          {/* Subject and Topic tags */}
          <div className="mb-2 flex flex-wrap gap-2">
            {note.subject && (
              <span className={`inline-block px-2 py-1 text-xs ${getSubjectColor(note.subject).light} ${getSubjectColor(note.subject).text} ${getSubjectColor(note.subject).dark} ${getSubjectColor(note.subject).darkText} rounded-full`}>
                {note.subject}
              </span>
            )}
            {note.topic && (
              <span className="inline-block px-2 py-1 text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full">
                {note.topic}
              </span>
            )}
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">
            {getDescription()}
          </p>
          <div className="flex justify-between items-center mt-2">
            <button
              onClick={handleView}
              className="text-primary dark:text-primary-light hover:text-primary-dark text-sm font-medium flex items-center"
            >
              View
            </button>
            <div className="flex items-center">
              <StarRating noteId={noteId} initialRating={averageRating} readOnly={false} />
              {ratingCount > 0 && (
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({ratingCount})</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  } catch (renderError) {
    console.error("Error rendering NoteCard:", renderError);
    return <InvalidNoteCard error="Failed to render note" compact={compact} />;
  }
};

export default NoteCard; 