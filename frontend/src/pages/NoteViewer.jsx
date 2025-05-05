import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import PDFViewer from '../components/PDFViewer';
import ErrorBoundary from '../components/ErrorBoundary';
import usePDFNote from '../hooks/usePDFNote';

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
      if (noteId) {
        console.log("Found ID in route params:", noteId);
        return noteId;
      }
      
      // Then try to get from query params
      const searchParams = new URLSearchParams(location.search);
      const queryId = searchParams.get('id');
      if (queryId) {
        console.log("Found ID in query params:", queryId);
      }
      return queryId;
    } catch (err) {
      console.error('Error getting note ID from URL:', err);
      return null;
    }
  };
  
  // Fetch note data
  useEffect(() => {
    let isMounted = true;
    
    const fetchNoteData = async () => {
      try {
        const id = getNoteIdFromUrl();
        
        if (!id) {
          setError('No note ID provided');
          setLoading(false);
          return;
        }
        
        console.log('Attempting to fetch note with ID:', id);
        
        // First try to load from localStorage
        let foundNote = null;
        try {
          const savedNotes = localStorage.getItem('notes');
          if (savedNotes) {
            const noteData = JSON.parse(savedNotes);
            if (Array.isArray(noteData)) {
              foundNote = noteData.find(n => n && (n._id === id || n.asset_id === id));
              
              if (foundNote) {
                console.log('Note found in localStorage:', foundNote._id || foundNote.asset_id);
                setNote(foundNote);
                setLoading(false);
                return;
              } else {
                console.log('Note not found in localStorage, trying API...');
              }
            }
          }
          
          // Also try completed notes storage
          const completedNotes = localStorage.getItem('completedNotes');
          if (completedNotes) {
            const completedData = JSON.parse(completedNotes);
            if (Array.isArray(completedData)) {
              const completedNote = completedData.find(n => n && n.id === id);
              if (completedNote) {
                console.log('Found in completed notes:', completedNote.id);
                // Use the completion data but need to fetch the actual note still
              }
            }
          }
        } catch (localStorageError) {
          console.error('Error reading from localStorage:', localStorageError);
        }
        
        // If not found in localStorage, try API
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
  
  // Use our custom hook to process the note data
  const { pdfUrl, noteTitle, noteId: processedNoteId, loading: hookLoading, error: hookError } = usePDFNote(note);
  
  // Debug output of actual data being passed to component
  useEffect(() => {
    console.log("Note data being processed:", {
      note,
      extracted: {
        pdfUrl,
        noteTitle,
        processedNoteId
      }
    });
  }, [note, pdfUrl, noteTitle, processedNoteId]);
  
  // Combine loading states
  const isLoading = loading || hookLoading;
  
  // Combine error states
  const errorMessage = error || hookError;
  
  // For direct rendering - might need to bypass the hook in some cases
  let directNoteUrl = '';
  let directNoteTitle = '';
  
  if (note && !pdfUrl) {
    console.log("Attempting direct extraction from note:", note);
    directNoteUrl = note.secure_url || note.fileUrl || note.url || '';
    directNoteTitle = note.title || (note.context && note.context.caption) || 'Untitled Note';
    
    if (directNoteUrl) {
      console.log("Using direct URL extraction:", directNoteUrl);
    }
  }
  
  // Loading state
  if (isLoading) {
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
  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-900">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-lg w-full shadow-md">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-500 dark:text-red-400 mr-3 mt-1 flex-shrink-0 text-xl" />
            <div>
              <h3 className="font-bold text-red-700 dark:text-red-300 mb-2">Error Loading Note</h3>
              <p className="text-red-600 dark:text-red-200 mb-4">{ensureString(errorMessage)}</p>
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
  
  // Extra validation - if no valid URL exists, show error
  if (!pdfUrl) {
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
  
  console.log('Rendering improved PDFViewer with:', { pdfUrl, noteTitle, processedNoteId });
  
  // Render the new PDFViewer within ErrorBoundary
  return (
    <ErrorBoundary>
      <PDFViewer 
        noteUrl={pdfUrl} 
        noteTitle={noteTitle} 
        noteId={processedNoteId} 
      />
    </ErrorBoundary>
  );
};

export default NoteViewer; 