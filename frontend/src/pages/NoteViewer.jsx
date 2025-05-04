import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import PDFViewer from '../components/notes/PDFViewer';
import ErrorBoundary from '../components/ErrorBoundary';

// Utility function to ensure string values
const ensureString = (value, defaultValue = '') => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') return value;
  try {
    return String(value);
  } catch (err) {
    console.error('Error converting value to string:', err);
    return defaultValue;
  }
};

const NoteViewer = () => {
  const { noteId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [note, setNote] = useState(null);
  
  // Get note ID from URL params or search params
  const getNoteIdFromUrl = () => {
    try {
      // First try to get from route params
      if (noteId) return noteId;
      
      // Then try to get from query params
      const searchParams = new URLSearchParams(location.search);
      return searchParams.get('id');
    } catch (err) {
      console.error('Error getting note ID from URL:', err);
      return null;
    }
  };
  
  // Fetch note data
  useEffect(() => {
    let isMounted = true;
    
    const id = getNoteIdFromUrl();
    
    if (!id) {
      console.warn('No note ID provided in URL');
      if (isMounted) {
        setError('No note ID provided');
        setLoading(false);
      }
      return;
    }
    
    const fetchNoteData = async () => {
      try {
        if (isMounted) {
          setLoading(true);
        }
        
        // Try to get from localStorage first to avoid API calls if possible
        let foundNote = null;
        try {
          const notesData = localStorage.getItem('notes');
          if (notesData) {
            const parsedNotes = JSON.parse(notesData);
            if (Array.isArray(parsedNotes)) {
              foundNote = parsedNotes.find(n => n && (n._id === id || n.asset_id === id));
              
              if (foundNote) {
                console.log('Note found in localStorage:', foundNote._id || foundNote.asset_id);
                if (isMounted) {
                  setNote(foundNote);
                  setLoading(false);
                }
                return;
              }
            }
          }
        } catch (parseError) {
          console.error('Failed to parse localStorage notes data:', parseError);
          // Continue to API fetch if localStorage parsing fails
        }
        
        // If not found in localStorage, try to import the fetch function
        try {
          const { fetchNotes } = await import('../api/notes');
          
          // Fetch from API
          console.log('Fetching notes from API...');
          const response = await fetchNotes();
          
          if (!isMounted) return;
          
          if (response && response.success) {
            if (Array.isArray(response.data)) {
              foundNote = response.data.find(n => n && (n._id === id || n.asset_id === id));
              
              if (foundNote) {
                console.log('Note found in API response:', foundNote._id || foundNote.asset_id);
                setNote(foundNote);
              } else {
                console.warn('Note not found in fetched data');
                setError('Note not found in collection');
              }
            } else {
              console.error('API response data is not an array:', response.data);
              setError('Invalid response format from server');
            }
          } else {
            console.error('API request failed:', response?.error || 'Unknown error');
            setError(response?.error || 'Failed to fetch note data');
          }
        } catch (apiError) {
          console.error('Error importing or calling fetchNotes:', apiError);
          setError('Failed to load note data. Please try again later.');
        }
      } catch (err) {
        console.error('Error fetching note:', err);
        if (isMounted) {
          setError('Failed to load note. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchNoteData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [noteId, location.search]); // Add dependencies to rerun if the URL changes
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-900">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
          <FaSpinner className="animate-spin text-4xl text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading note...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-900">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-lg w-full shadow-md">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-500 dark:text-red-400 mr-3 mt-1 flex-shrink-0 text-xl" />
            <div>
              <h3 className="font-bold text-red-700 dark:text-red-300 mb-2">Error Loading Note</h3>
              <p className="text-red-600 dark:text-red-200 mb-4">{ensureString(error)}</p>
              <button 
                onClick={() => navigate('/my-notes')} 
                className="px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                Back to Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // No note found
  if (!note) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-900">
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-lg w-full shadow-md">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-yellow-500 dark:text-yellow-400 mr-3 mt-1 flex-shrink-0 text-xl" />
            <div>
              <h3 className="font-bold text-yellow-700 dark:text-yellow-300 mb-2">Note Not Found</h3>
              <p className="text-yellow-600 dark:text-yellow-200 mb-4">The note you are looking for does not exist or has been removed.</p>
              <button 
                onClick={() => navigate('/my-notes')} 
                className="px-4 py-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors"
              >
                Back to Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Get proper note URL and title with safeguards
  let noteUrl;
  let noteTitle;
  
  try {
    // Check for common URL properties with fallbacks
    noteUrl = note.secure_url || note.fileUrl || note.url || '';
    
    // Further validate the URL before passing to PDFViewer
    if (noteUrl) {
      // Ensure it's a string
      noteUrl = ensureString(noteUrl, '');
      
      // Basic URL validation and fixes
      if (noteUrl && !noteUrl.startsWith('http://') && !noteUrl.startsWith('https://')) {
        console.warn('URL does not start with http:// or https://', noteUrl);
        
        // Try to prepend https:// if it's missing
        if (noteUrl.includes('cloudinary.com') || noteUrl.startsWith('//')) {
          noteUrl = 'https:' + (noteUrl.startsWith('//') ? noteUrl : '//' + noteUrl);
          console.log('Fixed URL to:', noteUrl);
        }
      }
    }
    
    // Get title with fallbacks
    noteTitle = ensureString(
      note.title || 
      (note.context && note.context.caption) || 
      note.filename,
      'Untitled Note'
    );
  } catch (err) {
    console.error('Error processing note data:', err);
    noteUrl = '';
    noteTitle = 'Error Processing Note';
  }
  
  // Extra validation - if no valid URL exists, show error
  if (!noteUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-900">
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-lg w-full shadow-md">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-yellow-500 dark:text-yellow-400 mr-3 mt-1 flex-shrink-0 text-xl" />
            <div>
              <h3 className="font-bold text-yellow-700 dark:text-yellow-300 mb-2">Invalid Note</h3>
              <p className="text-yellow-600 dark:text-yellow-200 mb-4">
                This note doesn't have a valid document URL.
              </p>
              <button 
                onClick={() => navigate('/my-notes')} 
                className="px-4 py-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors"
              >
                Back to Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  console.log('Rendering PDFViewer with:', { noteUrl, noteTitle });
  
  // Render PDFViewer within ErrorBoundary
  return (
    <ErrorBoundary>
      <PDFViewer noteUrl={noteUrl} noteTitle={noteTitle} />
    </ErrorBoundary>
  );
};

export default NoteViewer; 