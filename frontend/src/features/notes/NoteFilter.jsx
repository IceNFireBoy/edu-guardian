import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaSearch, FaBookOpen, FaDownload, FaShare, FaExclamationTriangle, FaRobot, FaStar, FaLightbulb } from 'react-icons/fa';
import cloudinaryService from '../../utils/cloudinaryService';
import { useStreak } from '../../hooks/useStreak';
import AISummarizer from '../../components/notes/AISummarizer';
import FlashcardGenerator from '../../components/FlashcardGenerator';
import FilterTags from '../../components/ui/FilterTags';
import NoteCard from '../../components/notes/NoteCard';
import { useToast } from '../../components/ui/Toast';
import { debug } from '../../components/DebugPanel';

// Fallback toast implementation
const createFallbackToast = () => {
  return {
    showToast: (message) => console.log('Toast message:', message),
    success: (message) => console.log('Success:', message),
    error: (message) => console.error('Error:', message),
    info: (message) => console.info('Info:', message),
    removeToast: () => {}
  };
};

// Get API base URL from environment variable or use fallback
const API_BASE = import.meta.env.VITE_BACKEND_URL || '';
console.log('Using API base URL:', API_BASE || '(none - using relative URL)');

// Filter Form Component
const FilterForm = ({ filters, setFilters, onSubmit }) => {
  // List of subjects
  const subjects = [
    "Mathematics", 
    "Physics", 
    "Chemistry", 
    "Biology", 
    "History", 
    "Geography", 
    "English", 
    "Literature", 
    "Computer Science",
    "Economics",
    "Business Studies"
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-100">
        <FaFilter className="mr-2 text-primary dark:text-primary-light" /> Filter Notes
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="grade-select">Grade</label>
          <select 
            id="grade-select"
            name="grade"
            value={filters.grade}
            onChange={handleChange}
            className="input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
            aria-label="Select grade"
          >
            <option value="">All Grades</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="semester-select">Semester</label>
          <select 
            id="semester-select"
            name="semester"
            value={filters.semester}
            onChange={handleChange}
            className="input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
            aria-label="Select semester"
          >
            <option value="">All Semesters</option>
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="quarter-select">Quarter</label>
          <select 
            id="quarter-select"
            name="quarter"
            value={filters.quarter}
            onChange={handleChange}
            className="input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
            aria-label="Select quarter"
          >
            <option value="">All Quarters</option>
            <option value="1">Q1</option>
            <option value="2">Q2</option>
            <option value="3">Q3</option>
            <option value="4">Q4</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="subject-select">Subject</label>
          <select 
            id="subject-select"
            name="subject"
            value={filters.subject}
            onChange={handleChange}
            className="input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
            aria-label="Select subject"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="relative">
          <input
            type="text"
            name="topic"
            value={filters.topic}
            onChange={handleChange}
            placeholder="Search by topic..."
            className="input pl-10 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            aria-label="Search by topic"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={onSubmit}
          className="btn btn-primary"
          aria-label="Apply filters"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

// Empty state component
const EmptyState = ({ hasFilters }) => (
  <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-md">
    <FaBookOpen className="text-5xl text-gray-400 dark:text-gray-500 mx-auto mb-4" />
    <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
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
          onClick={() => window.location.href = '/my-notes'} 
          className="btn bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Clear All Filters
        </button>
      )}
      <a href="/donate" className="btn btn-primary inline-block">
        Upload New Notes
      </a>
    </div>
  </div>
);

// Note Detail Modal
const NoteDetailModal = ({ note, isOpen, onClose }) => {
  const [showSummarizer, setShowSummarizer] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const { error } = useToast();
  
  if (!isOpen || !note) return null;
  
  const handleRatingChange = (newRating) => {
    try {
      // Save rating to localStorage
      const ratingsData = localStorage.getItem('note_ratings') || '{}';
      const ratings = JSON.parse(ratingsData);
      ratings[note.asset_id || note._id] = newRating;
      localStorage.setItem('note_ratings', JSON.stringify(ratings));
    } catch (err) {
      console.error('Error saving rating:', err);
      error('Failed to save rating. Please try again.');
    }
  };
  
  // Get a shareable link for the note
  const getShareableLink = () => {
    // Create a URL with the note ID as a parameter
    const baseUrl = window.location.origin;
    const noteId = note.asset_id || note._id;
    return `${baseUrl}/view-note?id=${noteId}`;
  };
  
  // Handle sharing functionality
  const handleShare = () => {
    const shareLink = getShareableLink();
    
    // Try to use the Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: note.title || note.context?.caption || 'Shared Note',
        text: 'Check out this note from EduGuardian!',
        url: shareLink
      }).catch(err => {
        console.error('Error sharing:', err);
        // Fallback to copying to clipboard
        copyToClipboard(shareLink);
      });
    } else {
      // Fallback to copying to clipboard
      copyToClipboard(shareLink);
    }
  };
  
  // Copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        error('Failed to copy link. Please try again.');
      });
  };
  
  const noteContent = note.description || note.context?.alt || "This note doesn't have enough content for processing.";
  const noteTitle = note.title || note.context?.caption || "Untitled Note";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-modal-title"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
              <h3 
                id="note-modal-title" 
                className="text-xl font-bold text-gray-800 dark:text-gray-100"
              >
                {noteTitle}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {note.resource_type === 'image' || note.fileType === 'image' ? (
                <img 
                  src={note.secure_url || note.fileUrl} 
                  alt={noteTitle} 
                  className="max-w-full mx-auto" 
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <a 
                    href={note.secure_url || note.fileUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-primary"
                  >
                    View File
                  </a>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-wrap gap-2">
                  {(note.tags || []).map((tag, index) => {
                    const tagValue = typeof tag === 'string' 
                      ? tag.replace(/_/g, ' ').replace(/^(grade|sem|quarter|subject|topic)_/, '')
                      : tag;
                    
                    return (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-primary/10 text-primary dark:text-primary-light text-xs rounded-full"
                      >
                        {tagValue}
                      </span>
                    );
                  })}
                </div>
                
                <div>
                  <StarRating 
                    noteId={note.asset_id || note._id} 
                    initialRating={getAverageRating(note.asset_id || note._id)}
                    onRatingChange={handleRatingChange}
                    size="medium"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-between items-center">
                <div className="flex flex-wrap gap-3">
                  <button 
                    className="btn flex items-center bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    onClick={() => setShowSummarizer(true)}
                  >
                    <FaRobot className="mr-2" /> AI Summarize
                  </button>
                  
                  <button 
                    className="btn flex items-center bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                    onClick={() => setShowFlashcards(true)}
                  >
                    <FaLightbulb className="mr-2" /> Generate Flashcards
                  </button>
                </div>
                
                <div className="flex space-x-3">
                  <button 
                    className="btn bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center"
                    onClick={() => window.open(note.secure_url || note.fileUrl, '_blank')}
                  >
                    <FaDownload className="mr-1" /> Download
                  </button>
                  <button 
                    className="btn btn-primary flex items-center"
                    onClick={handleShare}
                  >
                    <FaShare className="mr-1" /> Share
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* AI Summarizer */}
      <AISummarizer
        isOpen={showSummarizer}
        onClose={() => setShowSummarizer(false)}
        noteContent={noteContent}
        noteTitle={noteTitle}
      />
      
      {/* Flashcard Generator */}
      <FlashcardGenerator
        isOpen={showFlashcards}
        onClose={() => setShowFlashcards(false)}
        noteContent={noteContent}
        noteTitle={noteTitle}
      />
    </AnimatePresence>
  );
};

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

// Main NoteFilter Component
const NoteFilter = () => {
  const [filters, setFilters] = useState({
    grade: '',
    semester: '',
    quarter: '',
    subject: '',
    topic: ''
  });
  
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Add fallback for toast in case the Toast component isn't properly set up
  let toastFromContext;
  try {
    toastFromContext = useToast();
  } catch (err) {
    console.warn('Toast context not available, using fallback');
    toastFromContext = createFallbackToast();
  }
  const toast = toastFromContext;
  
  // Derived state
  const hasFiltersApplied = Object.values(filters).some(value => value !== '');
  
  // Fetch notes when component mounts
  useEffect(() => {
    const initialFetch = async () => {
      try {
        await fetchNotes();
        setIsInitialized(true);
      } catch (err) {
        console.error("Initial fetch error:", err);
        setError("Failed to load notes. Please refresh the page and try again.");
        setLoading(false);
        setIsInitialized(true);
      }
    };
    
    initialFetch();
  }, []);
  
  // Remove a single filter
  const removeFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: '' }));
    // Automatically apply the filter change if we're removing a filter
    setTimeout(() => fetchNotes(), 0);
  };
  
  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Filter only by non-empty values
      const filterContext = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      debug("[Frontend] Applying filters: " + JSON.stringify(filterContext));
      
      // Try to fetch from backend API first if available
      try {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        Object.entries(filterContext).forEach(([key, value]) => {
          queryParams.append(key, value);
        });
        
        // Use API_BASE if available, otherwise use relative URL
        const apiUrl = API_BASE 
          ? `${API_BASE}/api/v1/notes?${queryParams.toString()}`
          : `/api/v1/notes?${queryParams.toString()}`;
        
        debug('[Frontend] Fetching notes from API: ' + apiUrl);
        const response = await fetch(apiUrl);
        
        if (response.ok) {
          const data = await response.json();
          
          // Handle the API response format - check if data has a 'data' property (new API format)
          // or if it's an array directly (old format)
          let notesArray = [];
          
          if (data.success && Array.isArray(data.data)) {
            notesArray = data.data;
            debug(`[Frontend] Fetched ${notesArray.length} notes from API (new format)`);
          } else if (Array.isArray(data)) {
            notesArray = data;
            debug(`[Frontend] Fetched ${notesArray.length} notes from API (old format)`);
          } else {
            debug('[Frontend] API returned unexpected data format: ' + JSON.stringify(data).substring(0, 100) + '...');
          }
          
          setNotes(notesArray || []);
          
          // If no notes and filters applied, show specific message
          if ((notesArray || []).length === 0 && hasFiltersApplied) {
            debug("[Frontend] No notes found matching filters: " + JSON.stringify(filterContext));
          }
          
          setLoading(false);
          return;
        } else {
          debug(`[Frontend] API request failed with status: ${response.status}`);
          const errorText = await response.text();
          debug('[Frontend] API error details: ' + errorText);
        }
        // If backend API fails, fall back to Cloudinary or dummy data
      } catch (apiError) {
        debug('[Frontend] Backend API not available: ' + apiError.message);
        // Continue with fallback methods
      }
      
      // If Cloudinary is not configured properly, use dummy data
      let fetchedNotes = [];
      
      if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || !import.meta.env.VITE_CLOUDINARY_API_KEY) {
        debug('[Frontend] Using dummy notes as Cloudinary is not configured');
        fetchedNotes = cloudinaryService.getDummyNotes();
      } else {
        try {
          // Make sure the cloudinaryService exists and has the fetchNotesByContext method
          if (!cloudinaryService || typeof cloudinaryService.fetchNotesByContext !== 'function') {
            debug('[Frontend] Cloudinary service not properly configured');
            toast.error('Error: Note service configuration issue');
            fetchedNotes = cloudinaryService.getDummyNotes();
          } else {
            // Attempt to fetch from Cloudinary
            debug('[Frontend] Attempting to fetch from Cloudinary with filters: ' + JSON.stringify(filterContext));
            fetchedNotes = await cloudinaryService.fetchNotesByContext(filterContext);
            debug('[Frontend] Cloudinary returned ' + fetchedNotes.length + ' notes');
            
            // Add additional validation 
            if (!Array.isArray(fetchedNotes)) {
              debug('[Frontend] Invalid response from Cloudinary - not an array');
              toast.error('Error fetching notes: Invalid response format');
              fetchedNotes = cloudinaryService.getDummyNotes();
            }
          }
        } catch (cloudinaryError) {
          debug('[Frontend] Error fetching from Cloudinary: ' + cloudinaryError.message);
          toast.error('Cloudinary fetch error: ' + (cloudinaryError.message || 'Unknown error'));
          fetchedNotes = cloudinaryService.getDummyNotes();
        }
      }
      
      setNotes(fetchedNotes || []);
      
      // If no notes and filters applied, show specific message
      if ((fetchedNotes || []).length === 0 && hasFiltersApplied) {
        debug("[Frontend] No notes found in fallback source matching filters: " + JSON.stringify(filterContext));
      }
    } catch (err) {
      debug("[Frontend] Error fetching notes: " + err.message);
      setError("Failed to fetch notes. Please try again later.");
      toast.error('Error fetching notes: ' + (err.message || 'Unknown error'));
      // Set empty array to prevent rendering issues
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewNote = (note) => {
    if (!note) {
      console.error("Attempted to view undefined note");
      toast.error("Cannot view this note. Data is missing.");
      return;
    }
    setSelectedNote(note);
  };
  
  const closeNoteDetail = () => {
    setSelectedNote(null);
  };
  
  // Safe render method to prevent common JSX errors
  const renderNotes = () => {
    try {
      if (!notes || !Array.isArray(notes) || notes.length === 0) {
        return <EmptyState hasFilters={hasFiltersApplied} />;
      }
      
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => note && (
            <NoteCard 
              key={note.asset_id || note._id || `note-${Math.random()}`} 
              note={note} 
              onView={handleViewNote} 
            />
          ))}
        </div>
      );
    } catch (renderError) {
      console.error("Error rendering notes:", renderError);
      return (
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
          <p className="text-red-600 dark:text-red-300">Error displaying notes. Please try again.</p>
        </div>
      );
    }
  };
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">My Notes</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Browse through available notes or filter to find what you need.
        </p>
      </div>
      
      <FilterForm 
        filters={filters} 
        setFilters={setFilters} 
        onSubmit={fetchNotes} 
      />
      
      {/* Filter Tags */}
      <FilterTags 
        filters={filters} 
        onRemoveFilter={removeFilter} 
      />
      
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg mb-6 flex items-center" role="alert">
          <FaExclamationTriangle className="mr-2 text-yellow-600 dark:text-yellow-400" />
          <span>{error}</span>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading notes...</p>
        </div>
      ) : (
        renderNotes()
      )}
      
      {selectedNote && (
        <NoteDetailModal 
          note={selectedNote} 
          isOpen={!!selectedNote} 
          onClose={closeNoteDetail} 
        />
      )}
    </div>
  );
};

export default NoteFilter; 