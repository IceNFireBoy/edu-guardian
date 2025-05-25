import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBookOpen, FaFilePdf, FaImage, FaFileAlt, FaExclamationCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Note } from './noteTypes';
import { useStreak } from '../../hooks/useStreak';
import PDFThumbnail from './PDFThumbnail';
import EnhancedPDFIcon from './EnhancedPDFIcon';

interface SubjectColor {
  bg: string;
  light: string;
  text: string;
  dark: string;
  darkText: string;
}

interface SubjectColors {
  [key: string]: SubjectColor;
}

// Subject color mapping
export const subjectColors: SubjectColors = {
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
export const getSubjectColor = (subject: string): SubjectColor => {
  return subjectColors[subject] || subjectColors.default;
};

// Determine if we're in production mode
const isProduction = import.meta.env.PROD || window.location.hostname === 'eduguardian.netlify.app';

interface InvalidNoteCardProps {
  error?: string;
  compact?: boolean;
}

// Fallback for invalid notes
const InvalidNoteCard: React.FC<InvalidNoteCardProps> = ({ error, compact = false }) => {
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

interface RatingStats {
  avg: number;
  count: number;
}

const getRatingStats = (noteId: string): RatingStats => {
  try {
    const ratingsData = localStorage.getItem('note_ratings') || '{}';
    const ratings = JSON.parse(ratingsData);
    const allRatings = ratings[noteId] ? (Array.isArray(ratings[noteId]) ? ratings[noteId] : [ratings[noteId]]) : [];
    if (!allRatings.length) return { avg: 0, count: 0 };
    const sum = allRatings.reduce((a: number, b: number) => a + b, 0);
    return { avg: sum / allRatings.length, count: allRatings.length };
  } catch {
    return { avg: 0, count: 0 };
  }
};

interface NoteCardProps {
  note: Note;
  onView?: (note: Note) => void;
  compact?: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onView, compact = false }) => {
  // Handle invalid note prop
  if (!note || typeof note !== 'object') {
    console.error("NoteCard received invalid note prop:", note);
    return <InvalidNoteCard error="Missing note data" compact={compact} />;
  }
  
  const { recordActivity } = useStreak();
  const navigate = useNavigate();
  const noteId = note.id || `note-${Math.random()}`;
  const { avg: averageRating, count: ratingCount } = getRatingStats(noteId);
  
  const colorTheme = getSubjectColor(note.subject);

  const renderThumbnail = () => {
    // Prioritize explicitly provided thumbnailUrl
    if (note.thumbnailUrl) {
      return <img src={note.thumbnailUrl} alt={`${note.title} thumbnail`} className="w-full h-full object-cover" />;
    }
    // If fileType is an image, use fileUrl directly
    if (note.fileType && (note.fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(note.fileType.toLowerCase()))) {
      return <img src={note.fileUrl} alt={note.title} className="w-full h-full object-cover" />;
    }
    // If PDF, use specialized PDF icon/thumbnail component
    if (note.fileType === 'pdf' || (note.fileUrl && note.fileUrl.toLowerCase().endsWith('.pdf'))) {
      // return <PDFThumbnail fileUrl={note.fileUrl} /> // Assuming PDFThumbnail can generate from URL
      // For now, using EnhancedPDFIcon which is already in use or simpler icon
      return <EnhancedPDFIcon note={note} className="w-16 h-16" />;
    }
    // Fallback to generic file icon based on fileType or default
    if (note.fileType) {
        return <FaFileAlt className={`text-4xl ${colorTheme.text} ${colorTheme.darkText}`} />;
    }
    return <FaBookOpen className={`text-4xl ${colorTheme.text} ${colorTheme.darkText}`} />;
  };

  const handleView = () => {
    try {
      // Record the view activity for XP
      if (recordActivity && typeof recordActivity === 'function') {
        recordActivity('VIEW_NOTE');
      }
      
      // Navigate to the note viewer page
      navigate(`/view-note?id=${noteId}`);
      
      // Also call the parent handler if provided
      if (onView && typeof onView === 'function') {
        onView(note);
      }
    } catch (err) {
      console.error("Error handling note view:", err);
    }
  };
  
  // Get title from note
  const getTitle = (): string => {
    try {
      return note.title || 'Untitled Note';
    } catch (err) {
      console.error("Error getting note title:", err);
      return 'Untitled Note';
    }
  };
  
  // Get description from note
  const getDescription = (): string => {
    try {
      return note.description || 'No description available';
    } catch (err) {
      console.error("Error getting note description:", err);
      return 'No description available';
    }
  };
  
  // Get image url
  const getImageUrl = (): string => {
    try {
      return note.fileUrl || 
        (note.fileType === 'image' ? 'https://via.placeholder.com/400x300?text=Image+Not+Available' : '');
    } catch (err) {
      console.error("Error getting image URL:", err);
      return 'https://via.placeholder.com/400x300?text=Error+Loading+Image';
    }
  };
  
  // Extract and format tags
  const getTags = (): string[] => {
    try {
      const tags = note.tags || [];
      if (!Array.isArray(tags)) return [];
      
      return tags.map(tag => {
        if (!tag) return '';
        return String(tag);
      }).filter(tag => tag);
    } catch (err) {
      console.error("Error processing note tags:", err);
      return [];
    }
  };

  // Check if the note is a PDF
  const isPDF = (): boolean => {
    return note.fileType === 'pdf';
  };

  // For PDF thumbnails with a fallback to icon
  const [pdfThumbnailFailed, setPdfThumbnailFailed] = useState<boolean>(isProduction);
  
  // Set pdfThumbnailFailed to false initially in development environment
  useEffect(() => {
    if (!isProduction) {
      setPdfThumbnailFailed(false);
    }
  }, []);
  
  const renderPDFThumbnail = () => {
    if (isProduction || pdfThumbnailFailed) {
      return (
        <EnhancedPDFIcon note={note} className="w-full h-full" />
      );
    }
    
    return (
      <PDFThumbnail 
        url={getImageUrl()} 
        alt={getTitle()} 
        className="w-full h-full"
        onError={() => setPdfThumbnailFailed(true)}
      />
    );
  };

  // Define getIcon function or use a different approach

  // Render the component in a try/catch block to prevent rendering errors
  try {
    // Compact view for grid layouts
    if (compact) {
      return (
        <motion.div
          key={noteId}
          className={`rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-xl dark:bg-slate-800 ${compact ? 'h-full' : ''}`}
          whileHover={{ y: compact ? 0 : -5 }}
          onClick={handleView}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleView()}
          aria-label={`View note: ${getTitle()}`}
        >
          <div className={`relative ${compact ? 'h-32' : 'h-40 md:h-48'} ${colorTheme.light} ${colorTheme.dark} flex items-center justify-center overflow-hidden`}>
            {renderThumbnail()}
            {/* Subject Tag */}
            <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold ${colorTheme.bg} text-white shadow`}>
              {note.subject}
            </div>
          </div>

          <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
            <h3 className="font-semibold text-lg mb-1 line-clamp-2">
              {getTitle()}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
              {getDescription()}
            </p>
          </div>
          <div className="p-4 pt-0">
            <button
              onClick={handleView}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              View Note
            </button>
          </div>
        </motion.div>
      );
    }

    // Full view
    return (
      <motion.div
        key={noteId}
        className={`rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-xl dark:bg-slate-800 ${compact ? 'h-full' : ''}`}
        whileHover={{ y: compact ? 0 : -5 }}
        onClick={handleView}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleView()}
        aria-label={`View note: ${getTitle()}`}
      >
        <div className="h-40 overflow-hidden bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
          {note.fileType === 'image' ? (
            <img
              src={getImageUrl()}
              alt={getTitle()}
              className="w-full h-full object-cover"
            />
          ) : isPDF() ? (
            renderPDFThumbnail()
          ) : (
            getIcon()
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1">
            {getTitle()}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            {getDescription()}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {getTags().map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Rating: {averageRating.toFixed(1)} ({ratingCount})
              </span>
            </div>
            <button
              onClick={handleView}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              View Note
            </button>
          </div>
        </div>
      </motion.div>
    );
  } catch (err) {
    console.error("Error rendering NoteCard:", err);
    return <InvalidNoteCard error={err instanceof Error ? err.message : "Error rendering note"} />;
  }
};

export default NoteCard; 