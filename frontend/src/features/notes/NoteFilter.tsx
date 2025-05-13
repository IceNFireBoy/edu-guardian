import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaSearch, FaBookOpen, FaDownload, FaShare, FaExclamationTriangle, FaRobot, FaStar, FaLightbulb, FaTimes } from 'react-icons/fa';
import { useStreak } from '../../hooks/useStreak';
import AISummarizer from '../../features/notes/components/AISummarizer'; // Updated path
import FlashcardGenerator from '../../features/notes/components/FlashcardGenerator'; // Updated path
import FilterTags from '../../components/ui/FilterTags'; // Ensure this doesn't have .jsx
import NoteCard, { subjectColors, getSubjectColor } from '../../features/notes/NoteCard'; // Import TSX version
import StarRating from '../../components/notes/StarRating'; // Import StarRating component
import { Note } from '../../features/notes/noteTypes'; // Import Note type
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
    if (!note || !note.id) return;
    const result = await rateNote(note.id, newRating);
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
    const noteId = note.id; // Use note.id directly
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
      const filename = note.originalName || `${note.title || 'note'}.${note.fileType === 'pdf' ? 'pdf' : 'file'}`;
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
      const storedRating = localStorage.getItem(`note_rating_${note.id}`);
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
                    <AISummarizer noteId={note.asset_id || note._id} />
                  </motion.div>
                )}
                {showFlashcards && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <FlashcardGenerator noteId={note.asset_id || note._id} />
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-3 sm:mb-0">
                <StarRating 
                  noteId={note.id} 
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

// Main Note Filter Page Component (Typed)
const NoteFilter: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    grade: '',
    semester: '',
    quarter: '',
    subject: '',
    topic: '',
  });
  const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 1, currentPage: 1 });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { success: successToast, error: errorToast } = useToast();
  const { recordActivity } = useStreak();

  // Check for demo notes
  const hasDemoNotes = () => localStorage.getItem('has_added_demo_notes') === 'true';

  // Add demo notes if none exist
  const addDemoNote = async () => {
    if (hasDemoNotes()) return;
    debug('Adding demo note...');
    try {
      const demoNoteData = {
        title: "Demo Biology Notes",
        description: "Sample notes covering basic cell structures for Grade 11 Biology.",
        subject: "Biology",
        grade: "11",
        semester: "1",
        quarter: "1",
        topic: "Cell Biology",
        tags: ["demo", "cells", "biology", "grade11"],
        isPublic: true,
        // Add a placeholder or leave empty if no file is associated
        fileUrl: '#', 
        fileType: 'placeholder', 
        fileSize: 0,
        pageCount: 5, 
      };
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500)); 
      // Manually add to state and localStorage for demo
      const newDemoNote: Note = { 
        ...demoNoteData, 
        _id: `demo-${Date.now()}`,
        asset_id: `demo-asset-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        uploader: { _id: 'system', username: 'system' },
        // Provide default values for potentially missing fields
        thumbnailUrl: '', 
        isProcessing: false,
        aiSummary: null,
        flashcards: [],
        rating: 0,
        viewCount: 0,
      };
      setNotes(prev => [newDemoNote, ...prev]);
      localStorage.setItem('has_added_demo_notes', 'true');
      successToast('Added a demo note to get you started!');
    } catch (err) { 
      console.error('Error adding demo note:', err);
      errorToast('Could not add demo note.');
    }
  };

  // Initial Fetch and Cleanup
  useEffect(() => {
    const initialFetch = async () => {
      setLoading(true);
      try {
        await fetchNotesWithFilters();
      } catch (err) {
        setError('Failed to load initial notes.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initialFetch();
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    // Add demo note if initial fetch results in no notes
    if (!loading && notes.length === 0 && !hasDemoNotes() && !error) {
      addDemoNote();
    }
  }, [loading, notes, error]); // Run when loading state changes or notes/error update
  
  const removeFilter = (key: keyof Filters) => {
    setFilters(prev => ({ ...prev, [key]: '' }));
    fetchNotesWithFilters({ ...filters, [key]: '' }); // Re-fetch with updated filters
  };

  const clearAllFilters = () => {
    const clearedFilters = { grade: '', semester: '', quarter: '', subject: '', topic: '' };
    setFilters(clearedFilters);
    fetchNotesWithFilters(clearedFilters); // Re-fetch with cleared filters
  };

  const fetchNotesWithFilters = async (currentFilters: Filters = filters) => {
    setLoading(true);
    setError(null);
    try {
      // Construct query parameters from filters
      const queryParams = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });
      
      // Add pagination parameters
      queryParams.append('page', pagination.currentPage.toString());
      queryParams.append('limit', '12'); // Example limit

      const response = await callAuthenticatedApi<ApiResponse<NotesApiResponse>>(`/api/v1/notes?${queryParams.toString()}`, 'GET');

      if (response.success && response.data) {
        // Check file accessibility (optional, can be slow)
        // const accessibleNotes = await Promise.all(
        //   response.data.notes.map(async (note) => ({
        //     ...note,
        //     isAccessible: await isFileAccessible(note.fileUrl)
        //   }))
        // );
        setNotes(response.data.notes || []);
        setPagination({
          totalCount: response.data.totalCount || 0,
          totalPages: response.data.totalPages || 1,
          currentPage: response.data.currentPage || 1,
        });
        // Add demo note if no notes are found after filtering
        if ((response.data.notes || []).length === 0 && !hasDemoNotes()) {
          addDemoNote();
        }
      } else {
        throw new Error(response.error || 'Failed to fetch notes');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching notes.');
      errorToast('Failed to load notes. Please try again.');
      setNotes([]); // Clear notes on error
      // Attempt to add demo note even on error if none exists
      if (!hasDemoNotes()) {
        addDemoNote(); 
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
    recordActivity('VIEW_NOTE_DETAIL', `Viewed details for note: ${note.title}`);
  };

  const closeNoteDetail = () => {
    setIsModalOpen(false);
    setSelectedNote(null);
  };

  // Calculate if any filters are currently applied
  const hasFiltersApplied = Object.values(filters).some(value => value !== '');

  // Render Notes Grid
  const renderNotes = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          {/* Use a simple spinner or the LoadingSpinner component */}
          <FaSpinner className="animate-spin text-4xl text-primary dark:text-primary-light" /> 
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center py-8 px-4 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md border border-red-200 dark:border-red-800">
          <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-800 dark:text-red-300">Error Loading Notes</h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button onClick={() => fetchNotesWithFilters()} className="btn btn-primary">
            Retry
          </button>
        </div>
      );
    }
    
    if (notes.length === 0) {
      return <EmptyState hasFilters={hasFiltersApplied} />;
    }
    
    return (
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {notes.map((note, index) => (
          <motion.div
            key={note._id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <NoteCard note={note} onView={() => handleViewNote(note)} compact={true} />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <FilterForm 
        filters={filters} 
        setFilters={setFilters} 
        onSubmit={() => { setPagination(prev => ({...prev, currentPage: 1})); fetchNotesWithFilters(); }} 
        hasFiltersApplied={hasFiltersApplied}
        clearAllFilters={clearAllFilters}
      />
      
      {/* Display active filters */}
      {hasFiltersApplied && (
        <FilterTags filters={filters} onRemoveFilter={removeFilter} />
      )}
      
      {/* Notes Grid or Empty State */}
      {renderNotes()}
      
      {/* Pagination Controls (Simplified) */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <button 
            onClick={() => { setPagination(prev => ({...prev, currentPage: prev.currentPage - 1})); fetchNotesWithFilters({...filters}); }}
            disabled={pagination.currentPage <= 1 || loading}
            className="btn btn-secondary disabled:opacity-50 mr-2"
          >
            Previous
          </button>
          <span className="text-gray-700 dark:text-gray-300 px-4 py-2">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button 
            onClick={() => { setPagination(prev => ({...prev, currentPage: prev.currentPage + 1})); fetchNotesWithFilters({...filters}); }}
            disabled={pagination.currentPage >= pagination.totalPages || loading}
            className="btn btn-secondary disabled:opacity-50 ml-2"
          >
            Next
          </button>
        </div>
      )}

      {/* Note Detail Modal */}
      <NoteDetailModal 
        note={selectedNote} 
        isOpen={isModalOpen} 
        onClose={closeNoteDetail} 
      />
    </div>
  );
};

export default NoteFilter; 