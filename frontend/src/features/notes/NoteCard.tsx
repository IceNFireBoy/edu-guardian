import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBookOpen, FaFilePdf, FaImage, FaFileAlt, FaExclamationCircle, FaEye, FaDownload, FaStar, FaFileWord, FaFilePowerpoint, FaFileExcel } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import type { Note } from 'types/note';
import { getRelativeTime } from 'utils/dateUtils';
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
  onEdit?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  compact?: boolean;
  className?: string;
}

const getIcon = (fileType?: string) => {
  if (!fileType) return <FaFileAlt className="text-gray-500" />;
  
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return <FaFilePdf className="text-red-500" />;
    case 'doc':
    case 'docx':
      return <FaFileWord className="text-blue-500" />;
    case 'ppt':
    case 'pptx':
      return <FaFilePowerpoint className="text-orange-500" />;
    case 'xls':
    case 'xlsx':
      return <FaFileExcel className="text-green-500" />;
    default:
      return <FaFileAlt className="text-gray-500" />;
  }
};

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onView,
  onEdit,
  onDelete,
  compact = false,
  className = ''
}) => {
  // Handle invalid note prop
  if (!note || typeof note !== 'object') {
    console.error("NoteCard received invalid note prop:", note);
    return <InvalidNoteCard error="Missing note data" compact={compact} />;
  }
  
  const { recordActivity } = useStreak();
  const navigate = useNavigate();
  const noteId = note._id;
  const { avg: averageRating, count: ratingCount } = getRatingStats(noteId);
  
  const colorTheme = getSubjectColor(note.subject);
  const fileIcon = getIcon(note.fileType);

  const renderThumbnail = () => {
    // Prioritize explicitly provided thumbnailUrl
    if (note.thumbnailUrl) {
      return <img src={note.thumbnailUrl} alt={`${note.title} thumbnail`} className="w-full h-full object-cover" />;
    }
    // If fileType is an image, use fileUrl directly
    if (note.fileType && (note.fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(note.fileType.toLowerCase()))) {
      return note.fileUrl ? <img src={note.fileUrl} alt={note.title} className="w-full h-full object-cover" /> : null;
    }
    // If PDF, use specialized PDF icon/thumbnail component
    if (note.fileType === 'pdf' || (note.fileUrl && note.fileUrl.toLowerCase().endsWith('.pdf'))) {
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
      return note.content || 'No description available';
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
        fileUrl={note.fileUrl || ''}
        onError={() => setPdfThumbnailFailed(true)}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-slate-700 ${compact ? 'h-full flex flex-col' : ''} ${className}`}
    >
      <div 
        className={`${compact ? 'h-32' : 'h-40'} relative cursor-pointer`}
        onClick={handleView}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10" />
        {renderThumbnail()}
        <div className="absolute top-3 left-3 z-20">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorTheme.light} ${colorTheme.text}`}>{note.subject}</span>
        </div>
        <div className="absolute bottom-0 left-0 p-3 z-20 flex items-center space-x-2">
          {note.isPublic && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">Public</span>
          )}
        </div>
        <div className="absolute bottom-0 right-0 p-3 z-20">
          {note.createdAt && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              {new Date(note.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex-grow">
        <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white line-clamp-2">
          {getTitle()}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-2">
          {getDescription()}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <span className="flex items-center">
              <FaEye className="mr-1" /> {note.viewCount}
            </span>
            <span className="flex items-center">
              <FaDownload className="mr-1" /> {note.downloadCount}
            </span>
          </div>
          <span>{getRelativeTime(note.updatedAt)}</span>
        </div>
      </div>

      <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`w-4 h-4 ${
                    star <= averageRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
              ({ratingCount})
            </span>
          </div>
          <button
            onClick={handleView}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
          >
            View Details
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default NoteCard; 