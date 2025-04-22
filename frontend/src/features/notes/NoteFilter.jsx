import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaSearch, FaBookOpen, FaDownload, FaShare, FaExclamationTriangle } from 'react-icons/fa';
import cloudinaryService from '../../utils/cloudinaryService';
import { useStreak } from '../../hooks/useStreak';

// Note Card Component
const NoteCard = ({ note, onView }) => {
  const { recordActivity } = useStreak();
  
  const handleView = () => {
    // Record the view activity for XP
    recordActivity('VIEW_NOTE');
    
    // Call the parent handler
    onView(note);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden"
    >
      <div className="h-40 overflow-hidden bg-gray-100 dark:bg-slate-700">
        {note.resource_type === 'image' ? (
          <img 
            src={note.secure_url} 
            alt={note.context?.alt || 'Note preview'} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaBookOpen className="text-4xl text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 text-gray-800 dark:text-gray-100">
          {note.context?.caption || 'Untitled Note'}
        </h3>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {note.tags?.map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-primary/10 text-primary dark:text-primary-light text-xs rounded-full"
            >
              {tag.replace(/_/g, ' ').replace(/^(grade|sem|quarter|subject|topic)_/, '')}
            </span>
          ))}
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          {note.context?.alt || 'No description available'}
        </p>
        
        <div className="flex justify-between items-center">
          <button
            onClick={handleView}
            className="text-primary dark:text-primary-light hover:text-primary-dark text-sm font-medium flex items-center"
          >
            <FaBookOpen className="mr-1" /> View Note
          </button>
          
          <div className="flex space-x-2">
            <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              <FaDownload />
            </button>
            <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              <FaShare />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

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
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Grade</label>
          <select 
            name="grade"
            value={filters.grade}
            onChange={handleChange}
            className="input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
          >
            <option value="">All Grades</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Semester</label>
          <select 
            name="semester"
            value={filters.semester}
            onChange={handleChange}
            className="input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
          >
            <option value="">All Semesters</option>
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Quarter</label>
          <select 
            name="quarter"
            value={filters.quarter}
            onChange={handleChange}
            className="input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
          >
            <option value="">All Quarters</option>
            <option value="1">Q1</option>
            <option value="2">Q2</option>
            <option value="3">Q3</option>
            <option value="4">Q4</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Subject</label>
          <select 
            name="subject"
            value={filters.subject}
            onChange={handleChange}
            className="input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
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
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={onSubmit}
          className="btn btn-primary"
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
  </div>
);

// Note Detail Modal
const NoteDetailModal = ({ note, isOpen, onClose }) => {
  if (!isOpen || !note) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{note.context?.caption || 'Untitled Note'}</h3>
              <button
                onClick={onClose}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
              >
                &times;
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {note.resource_type === 'image' ? (
                <img 
                  src={note.secure_url} 
                  alt={note.context?.alt || 'Note content'} 
                  className="max-w-full mx-auto" 
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <a 
                    href={note.secure_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-primary"
                  >
                    View PDF
                  </a>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t dark:border-slate-700">
              <div className="flex justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  {note.tags?.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-primary/10 text-primary dark:text-primary-light text-xs rounded-full"
                    >
                      {tag.replace(/_/g, ' ').replace(/^(grade|sem|quarter|subject|topic)_/, '')}
                    </span>
                  ))}
                </div>
                
                <div className="flex space-x-3">
                  <button className="btn bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center">
                    <FaDownload className="mr-1" /> Download
                  </button>
                  <button className="btn btn-primary flex items-center">
                    <FaShare className="mr-1" /> Share
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [hasFiltersApplied, setHasFiltersApplied] = useState(false);
  
  // Fetch notes when component mounts
  useEffect(() => {
    fetchNotes();
  }, []);
  
  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if any filters are applied
      const hasFilters = Object.values(filters).some(value => value !== '');
      setHasFiltersApplied(hasFilters);
      
      // Filter only by non-empty values
      const filterContext = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      // If Cloudinary is not configured properly, use dummy data
      let fetchedNotes = [];
      if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || !import.meta.env.VITE_CLOUDINARY_API_KEY) {
        console.log('Using dummy notes as Cloudinary is not configured');
        fetchedNotes = cloudinaryService.getDummyNotes();
      } else {
        fetchedNotes = await cloudinaryService.fetchNotesByContext(filterContext);
      }
      
      setNotes(fetchedNotes);
      
      // If no notes and filters applied, show specific message
      if (fetchedNotes.length === 0 && hasFilters) {
        setError("No notes match your selected filters.");
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError("Failed to fetch notes. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewNote = (note) => {
    setSelectedNote(note);
  };
  
  const closeNoteDetail = () => {
    setSelectedNote(null);
  };
  
  const hasAnyFilters = Object.values(filters).some(value => value !== '');
  
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
      
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg mb-6 flex items-center">
          <FaExclamationTriangle className="mr-2 text-yellow-600 dark:text-yellow-400" />
          <span>{error}</span>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <EmptyState hasFilters={hasAnyFilters} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <NoteCard 
              key={note.asset_id} 
              note={note} 
              onView={handleViewNote} 
            />
          ))}
        </div>
      )}
      
      <NoteDetailModal 
        note={selectedNote} 
        isOpen={!!selectedNote} 
        onClose={closeNoteDetail} 
      />
    </div>
  );
};

export default NoteFilter; 