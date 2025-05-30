import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaSearch, FaBookOpen, FaDownload, FaShare, FaExclamationTriangle, FaRobot, FaStar, FaLightbulb, FaTimes, FaSpinner } from 'react-icons/fa';
import { useStreak } from '../../hooks/useStreak';
import AISummarizer from '../../features/notes/components/AISummarizer'; // Updated path
import FlashcardGenerator from '../../features/notes/components/FlashcardGenerator'; // Updated path
import FilterTags from '../../components/ui/FilterTags'; // Ensure this doesn't have .jsx
import NoteCard, { subjectColors, getSubjectColor } from '../../features/notes/NoteCard'; // Import TSX version
import StarRating from '../../components/notes/StarRating'; // Import StarRating component
import { Note, NoteFilter as NoteFilterType } from '../../types/note';
import { useToast } from '../../hooks/useToast'; // Use our TSX hook
import { debug } from '../../components/DebugPanel'; // Keep as is for now
import { callAuthenticatedApi, ApiResponse } from '../../api/notes'; // Import TSX version and type
import { useNote } from './useNote'; // Corrected import path

// Development mode for debugging
const DEV_MODE = import.meta.env.DEV;

// Get API base URL from environment variable or use fallback
const API_BASE = import.meta.env.VITE_BACKEND_URL || '';
console.log('Using API base URL:', API_BASE || '(none - using relative URL)');

// Define Filter types
interface Filters {
  grade: string;
  semester: string;
  quarter: string;
  subject: string;
  topic: string;
}

interface FilterFormProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onSubmit: () => void;
  hasFiltersApplied: boolean;
  clearAllFilters: () => void;
}

// Filter Form Component (Typed)
const FilterForm: React.FC<FilterFormProps> = ({ filters, setFilters, onSubmit, hasFiltersApplied, clearAllFilters }) => {
  // List of subjects
  const subjects: string[] = [
    "Biology", "Business Mathematics", "Calculus", "Chemistry", "Computer", "Creative Writing", 
    "Disciplines in the Social Sciences", "Drafting", "English", "Filipino", "Fundamentals of Accounting", 
    "General Mathematics", "Introduction to World Religion", "Organization and Management", "Photography", 
    "Physics", "Religion", "Research", "Science", "Social Science", "Trends, Networks, and Critical Thinking"
  ];
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6 mb-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-100">
        <FaFilter className="mr-2 text-primary dark:text-primary-light" /> Filter Notes
      </h2>
      
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Grade Select */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="grade-select">Grade</label>
            <select 
              id="grade-select"
              name="grade"
              value={filters.grade}
              onChange={handleChange}
              className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
              aria-label="Select grade"
            >
              <option value="">All Grades</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
            </select>
          </div>
          
          {/* Semester Select */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="semester-select">Semester</label>
            <select 
              id="semester-select"
              name="semester"
              value={filters.semester}
              onChange={handleChange}
              className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
              aria-label="Select semester"
            >
              <option value="">All Semesters</option>
              <option value="1">1st Semester</option>
              <option value="2">2nd Semester</option>
            </select>
          </div>
          
          {/* Quarter Select */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="quarter-select">Quarter</label>
            <select 
              id="quarter-select"
              name="quarter"
              value={filters.quarter}
              onChange={handleChange}
              className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
              aria-label="Select quarter"
            >
              <option value="">All Quarters</option>
              <option value="1">Q1</option>
              <option value="2">Q2</option>
              <option value="3">Q3</option>
              <option value="4">Q4</option>
            </select>
          </div>
          
          {/* Subject Select */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="subject-select">Subject</label>
            <select 
              id="subject-select"
              name="subject"
              value={filters.subject}
              onChange={handleChange}
              className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
              aria-label="Select subject"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Topic Search */}
        <div className="mt-4">
          <div className="relative">
            <input
              type="text"
              name="topic"
              value={filters.topic}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Search by topic..."
              className="w-full input pl-10 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              aria-label="Search by topic"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      
        {/* Action Buttons */}
        <div className="mt-4 flex justify-end gap-3">
          {hasFiltersApplied && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="w-full sm:w-auto btn bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              aria-label="Clear filters"
            >
              Clear All Filters
            </button>
          )}
          <button
            type="submit"
            className="w-full sm:w-auto btn btn-primary"
            aria-label="Apply filters"
          >
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
};

interface EmptyStateProps {
  hasFilters: boolean;
}

// Empty state component (Typed)
const EmptyState: React.FC<EmptyStateProps> = ({ hasFilters }) => (
  <div className="text-center py-8 sm:py-12 px-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
    <FaBookOpen className="text-4xl sm:text-5xl text-gray-400 dark:text-gray-500 mx-auto mb-4" />
    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
      {hasFilters ? "No Notes Found" : "Start Exploring Notes"}
    </h3>
    <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
      {hasFilters 
        ? "No notes match your selected filters. Try adjusting your search criteria or upload some notes to get started." 
        : "Use the filters above to find specific notes, or browse all available notes."}
    </p>
    <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
      {hasFilters && (
        <button 
          onClick={() => window.location.reload()} // Simplified clear for now
          className="w-full sm:w-auto btn bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Clear All Filters
        </button>
      )}
      {/* Link to upload page - adjust path if needed */}
      <a href="/notes/upload" className="w-full sm:w-auto btn btn-primary inline-block">
        Upload New Notes
      </a>
    </div>
  </div>
);

interface NoteDetailModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
}

// Note Detail Modal (Typed)
const NoteDetailModal: React.FC<NoteDetailModalProps> = ({ note, isOpen, onClose }) => {
  const [showSummarizer, setShowSummarizer] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const { error: errorToast, success: successToast } = useToast();
  const { addManualFlashcard, loading: noteHookLoading, error: noteHookError } = useNote(); // Assuming useNote is imported if needed here, or passed
  const { rateNote, loading: ratingLoading, error: ratingError } = useNote(); // For rating

  if (!isOpen || !note) return null;
  
  // Get color theme for subject
  const colorTheme = note.subject ? getSubjectColor(note.subject) : subjectColors.default;
  
  // Function to handle rating changes from StarRating component
  const handleRatingSubmit = async (newRating: number) => {
    if (!note || !note._id) return;
    const result = await rateNote(note._id, newRating);
    if (result) {
      successToast('Rating submitted successfully!');
      // Optionally, update local note state if it contains rating details that should be live updated
      // Or trigger a refetch of the note if parent component manages that
    } else {
      errorToast(ratingError || 'Failed to submit rating.');
    }
  };

  const getShareableLink = (): string => {
    const baseUrl = window.location.origin;
    const noteId = note._id; // Use note._id directly
    return `${baseUrl}/view-note?id=${noteId}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      successToast('Link copied to clipboard!');
    }, (err) => {
      console.error('Failed to copy link:', err);
      errorToast('Failed to copy link.');
    });
  };
  
  const handleShare = () => {
    const shareLink = getShareableLink();
    copyToClipboard(shareLink);
  };
  
  const handleDownload = async () => {
    if (!note.fileUrl) {
      errorToast('Download link is not available for this note.');
      return;
    }
    
    try {
      // Fetch the file as a blob
      const response = await fetch(note.fileUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      
      // Suggest a filename (use original name or a generic one)
      const filename = note.title || `${note.title || 'note'}.${note.fileType === 'pdf' ? 'pdf' : 'file'}`;
      link.download = filename;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Revoke the object URL to free up memory
      URL.revokeObjectURL(link.href);
      
      successToast('Note downloaded successfully!');
    } catch (err) {
      console.error('Error downloading file:', err);
      errorToast('Failed to download the note. The file might be inaccessible or corrupted.');
    }
  };

  // Get initial rating from localStorage or note data for StarRating
  // This logic is now encapsulated within StarRating, but we might need an average for display
  // For display purposes, we might still want the average rating if the note object carries it.
  // const { avg: averageRating, count: ratingCount } = getRatingStats(note.id);
  // For initialRating prop of StarRating, we can pass note.rating (if it represents user's own rating) or 0
  const initialUserRating = () => {
    try {
      const storedRating = localStorage.getItem(`note_rating_${note._id}`);
      return storedRating ? parseFloat(storedRating) : (note.rating || 0); // Fallback to note.rating if available
    } catch {
      return note.rating || 0;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            {/* Modal Header */}
            <div className={`p-4 border-b dark:border-slate-700 flex justify-between items-center ${colorTheme.light} ${colorTheme.dark}`}>
              <h2 className={`text-xl font-semibold ${colorTheme.text} ${colorTheme.darkText}`}>{note.title || 'Note Details'}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <FaTimes size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4">
                <span className={`text-sm font-medium px-2 py-0.5 rounded ${colorTheme.light} ${colorTheme.dark} ${colorTheme.text} ${colorTheme.darkText}`}>
                  {note.subject || 'Uncategorized'}
                </span>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4">{note.description || 'No description provided.'}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div><strong className="text-gray-600 dark:text-gray-400">Grade:</strong> {note.grade || 'N/A'}</div>
                <div><strong className="text-gray-600 dark:text-gray-400">Semester:</strong> {note.semester || 'N/A'}</div>
                <div><strong className="text-gray-600 dark:text-gray-400">Quarter:</strong> {note.quarter || 'N/A'}</div>
                <div><strong className="text-gray-600 dark:text-gray-400">Topic:</strong> {note.topic || 'N/A'}</div>
              </div>
              
              {/* AI Features Toggle Buttons */}
              <div className="flex space-x-4 mb-4 border-t pt-4 dark:border-slate-700">
                <button 
                  onClick={() => { setShowSummarizer(!showSummarizer); setShowFlashcards(false); }}
                  className={`btn btn-sm flex items-center ${showSummarizer ? 'btn-primary' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                >
                  <FaRobot className="mr-2" /> AI Summary
                </button>
                <button 
                  onClick={() => { setShowFlashcards(!showFlashcards); setShowSummarizer(false); }}
                  className={`btn btn-sm flex items-center ${showFlashcards ? 'btn-primary' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                >
                  <FaLightbulb className="mr-2" /> AI Flashcards
                </button>
              </div>

              {/* AI Features Content Area */}
              <AnimatePresence>
                {showSummarizer && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <AISummarizer noteId={note._id} />
                  </motion.div>
                )}
                {showFlashcards && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <FlashcardGenerator noteId={note._id} />
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-3 sm:mb-0">
                <StarRating 
                  noteId={note._id} 
                  initialRating={initialUserRating()} 
                  onRatingChange={handleRatingSubmit} 
                  size="medium" 
                />
                {/* Display average rating and count if available from note object */}
                {note.ratingCount > 0 && (
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    (Avg: {note.rating.toFixed(1)} from {note.ratingCount} ratings)
                  </span>
                )}
              </div>
              <div className="flex space-x-3">
                <button onClick={handleShare} className="btn bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center">
                  <FaShare className="mr-2" /> Share
                </button>
                <button onClick={handleDownload} className="btn btn-primary flex items-center" disabled={!note.fileUrl}>
                  <FaDownload className="mr-2" /> Download
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Helper function to check if a URL is accessible
async function isFileAccessible(url: string): Promise<boolean> {
  if (!url) return false;
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    // Note: 'no-cors' often returns opaque responses (status 0), 
    // but if the request itself doesn't throw an error, it likely means the URL is routable.
    // This is not a perfect check but better than nothing for cross-origin HEAD requests.
    return true; 
  } catch (error) {
    console.warn(`File at ${url} might be inaccessible:`, error);
    return false;
  }
}

interface NotesApiResponse {
  notes: Note[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

interface NoteFilterProps {
  mode?: 'all' | 'mine'; // Add mode prop
}

const NoteFilter: React.FC<NoteFilterProps> = ({ mode = 'all' }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NoteFilterType>({});

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (mode === 'mine') {
        response = await callAuthenticatedApi<{ success: boolean; data: Note[]; count?: number }>(
          '/api/v1/users/me/notes',
          'GET',
          filters as any
        );
      } else {
        response = await callAuthenticatedApi<{ success: boolean; data: Note[]; count?: number }>(
          '/api/v1/notes',
          'GET',
          filters as any
        );
      }
      if (response.success && Array.isArray(response.data)) {
        setNotes(response.data);
      } else {
        throw new Error(response.error || response.message || 'Failed to fetch notes');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notes');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [mode, filters]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleFilterChange = (newFilters: NoteFilterType) => {
    setFilters(newFilters);
  };

  return (
    <div className="note-filter">
      {/* ... rest of the component ... */}
    </div>
  );
};

export default NoteFilter; 