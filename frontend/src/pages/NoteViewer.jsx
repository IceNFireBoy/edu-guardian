import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaSpinner, FaExclamationTriangle, FaCoffee } from 'react-icons/fa';
import PDFViewer from '../components/PDFViewer';
import ErrorBoundary from '../components/ErrorBoundary';
import usePDFNote from '../hooks/usePDFNote';
import NoteStudySession from '../components/notes/NoteStudySession';
import Sidebar from '../components/layout/Sidebar';

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
  const { noteId: paramNoteId } = useParams(); // Renamed to avoid conflict
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // Loading state for initial fetch
  const [error, setError] = useState(null); // Error state for initial fetch
  const [note, setNote] = useState(null);
  const [sessionTime, setSessionTime] = useState(0); // in seconds
  const [breakTime, setBreakTime] = useState(0); // in seconds
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showBreakOptions, setShowBreakOptions] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [studyStartTime] = useState(Date.now());
  const sessionTimerRef = useRef(null);
  const breakTimerRef = useRef(null);

  // Get note ID from URL params or search params
  const getNoteIdFromUrl = () => {
    try {
      // First try to get from route params
      if (paramNoteId) {
        console.log("Found ID in route params:", paramNoteId);
        return paramNoteId;
      }
      // Then try to get from query params
      const searchParams = new URLSearchParams(location.search);
      const queryId = searchParams.get('id');
      if (queryId) {
        console.log("Found ID in query params:", queryId);
        return queryId;
      }
      console.warn("No Note ID found in URL params or query string.");
      return null;
    } catch (err) {
      console.error('Error getting note ID from URL:', err);
      return null;
    }
  };

  // Fetch note data
  useEffect(() => {
    let isMounted = true;
    const fetchNoteData = async () => {
      setLoading(true); // Start loading
      setError(null);   // Clear previous errors
      setNote(null);    // Clear previous note data

      const id = getNoteIdFromUrl();
      if (!id) {
        if (isMounted) {
          setError('No note ID provided in the URL');
          setLoading(false);
        }
        return;
      }

      console.log('Attempting to fetch note with ID:', id);
      try {
        // Try localStorage first
        let foundNote = null;
        try {
          const savedNotes = localStorage.getItem('notes');
          if (savedNotes) {
            const noteData = JSON.parse(savedNotes);
            if (Array.isArray(noteData)) {
              foundNote = noteData.find(n => n && (n._id === id || n.asset_id === id));
              if (foundNote) {
                console.log('Note found in localStorage:', foundNote._id || foundNote.asset_id);
                if (isMounted) {
                  setNote(foundNote);
                  setLoading(false); // Found in local, stop loading
                }
                return; // Exit early, no need for API call
              } else {
                 console.log('Note not found in localStorage cache.');
              }
            }
          }
        } catch (localStorageError) {
          console.error('Error reading notes from localStorage:', localStorageError);
        }

        // If not in localStorage, try API
        console.log('Attempting to fetch notes from API...');
        // Dynamically import fetchNotes to potentially improve initial load
        const { fetchNotes } = await import('../api/notes');
        const response = await fetchNotes();

        if (!isMounted) return; // Check if component is still mounted

        if (response && response.success && Array.isArray(response.data)) {
          foundNote = response.data.find(n => n && (n._id === id || n.asset_id === id));
          if (foundNote) {
            console.log('Note found in API response:', foundNote._id || foundNote.asset_id);
            setNote(foundNote);
          } else {
            console.warn(`Note with ID ${id} not found in API response.`);
            setError('Note not found');
          }
        } else {
          console.error('API request failed or returned invalid data:', response);
          setError(response?.error || 'Failed to fetch note data from server');
        }
      } catch (err) {
        console.error('Error during note fetching process:', err);
        if (isMounted) {
          setError('Failed to load note data. Please check connection or try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false); // Fetch attempt finished, stop loading
        }
      }
    };

    fetchNoteData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [paramNoteId, location.search]); // Re-run if ID or query changes

  // Use our custom hook to process the note data *once available*
  // Pass null if note is not yet loaded to avoid unnecessary processing
  const { pdfUrl: hookPdfUrl, noteTitle: hookNoteTitle, noteId: hookNoteId, loading: hookLoading, error: hookError } = usePDFNote(note);

  // Log state right before render checks
  console.log('Rendering NoteViewer - States:', {
    loading, // from fetch
    error,   // from fetch
    note: note ? 'Exists' : 'null', // Log existence, not the whole object
    hookLoading,
    hookError,
    hookPdfUrl: hookPdfUrl ? 'Exists' : 'null', // Log existence
    hookNoteTitle,
    hookNoteId: hookNoteId ? 'Exists' : 'null', // Log existence
  });

  // Combined Loading state check
  // Consider fetch loading OR hook loading if note is present but hook is still processing
  const isLoading = loading || (note && hookLoading);
  if (isLoading) {
    console.log('Rendering NoteViewer - Showing Loading State');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-900">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
          <FaSpinner className="animate-spin text-4xl text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading note...</p>
        </div>
      </div>
    );
  }

  // Combined Error state check (fetch error OR hook error)
  const errorMessage = error || hookError;
  if (errorMessage) {
    console.log('Rendering NoteViewer - Showing Error State:', errorMessage);
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

  // No Note Found state (if fetch finished without error, but note is still null)
  if (!note) {
    console.log('Rendering NoteViewer - Showing No Note Found State (note is null after loading)');
     return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-900">
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-lg w-full shadow-md">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-yellow-500 dark:text-yellow-400 mr-3 mt-1 flex-shrink-0 text-xl" />
            <div>
              <h3 className="font-bold text-yellow-700 dark:text-yellow-300 mb-2">Note Not Found</h3>
              <p className="text-yellow-600 dark:text-yellow-200 mb-4">The specific note could not be loaded or found.</p>
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

  // --- If we pass all above checks: note exists, no loading, no errors ---

  // Determine final props directly here using the hook results or direct extraction
  const finalPdfUrl = hookPdfUrl || (note.secure_url || note.fileUrl || note.url) || null;
  const finalNoteTitle = hookNoteTitle || (note.title || (note.context && note.context.caption)) || 'Untitled Note';
  const finalNoteId = hookNoteId || note._id || note.id || note.asset_id || null;

  console.log('Rendering NoteViewer - Final Props Determination:', {
    finalPdfUrl: finalPdfUrl ? 'Exists' : 'null',
    finalNoteTitle,
    finalNoteId: finalNoteId ? 'Exists' : 'null',
  });

  // Final URL Check: If after everything, we still have no URL
  if (!finalPdfUrl) {
    console.error('Rendering NoteViewer - Final URL Check FAILED. No URL could be determined.');
    return (
     <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-900">
       <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-lg w-full shadow-md">
         {/* Using the same error message structure */}
         <div className="flex items-start">
           <FaExclamationTriangle className="text-red-500 dark:text-red-400 mr-3 mt-1 flex-shrink-0 text-xl" />
           <div>
             <h3 className="font-bold text-red-700 dark:text-red-300 mb-2">Error Loading Note</h3>
             <p className="text-red-600 dark:text-red-200 mb-4">
               Could not determine a valid URL for the note document.
             </p>
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

  // --- If we have a URL, render the PDFViewer ---
  console.log('Rendering NoteViewer - Proceeding to PDFViewer component.');

  // Session timer
  useEffect(() => {
    if (!isPaused && !isBreakActive) {
      sessionTimerRef.current = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(sessionTimerRef.current);
  }, [isPaused, isBreakActive]);

  // Break timer
  useEffect(() => {
    if (isBreakActive && breakTime > 0) {
      breakTimerRef.current = setInterval(() => {
        setBreakTime((prev) => {
          if (prev <= 1) {
            setIsBreakActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(breakTimerRef.current);
  }, [isBreakActive, breakTime]);

  // Break controls
  const startShortBreak = () => {
    setBreakTime(10 * 60);
    setIsBreakActive(true);
    setShowBreakOptions(false);
  };
  const startLongBreak = () => {
    setBreakTime(30 * 60);
    setIsBreakActive(true);
    setShowBreakOptions(false);
  };
  const startCustomBreak = () => {
    const minutes = parseInt(customTime);
    if (!minutes || minutes <= 0) return;
    setBreakTime(minutes * 60);
    setIsBreakActive(true);
    setShowBreakOptions(false);
    setCustomTime('');
  };
  const cancelBreak = () => {
    setIsBreakActive(false);
    setBreakTime(0);
  };
  const togglePause = () => setIsPaused((prev) => !prev);

  const studySessionPanel = (
    <NoteStudySession
      noteUrl={finalPdfUrl}
      noteTitle={finalNoteTitle}
      noteId={finalNoteId}
      subject={note && (note.subject || finalNoteTitle)}
      sidebarMode
      sessionTime={sessionTime}
      isPaused={isPaused}
      togglePause={togglePause}
      isBreakActive={isBreakActive}
      breakTime={breakTime}
      startShortBreak={startShortBreak}
      startLongBreak={startLongBreak}
      startCustomBreak={startCustomBreak}
      cancelBreak={cancelBreak}
      showBreakOptions={showBreakOptions}
      setShowBreakOptions={setShowBreakOptions}
      customTime={customTime}
      setCustomTime={setCustomTime}
      studyStartTime={studyStartTime}
    />
  );

  return (
    <ErrorBoundary>
      <Sidebar studySessionPanel={studySessionPanel} />
      {/* Break Overlay */}
      {isBreakActive && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-blue-900/80">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md w-full flex flex-col items-center animate-pulse">
            <FaCoffee className="text-blue-600 dark:text-blue-400 text-6xl mb-4 animate-bounce" />
            <h2 className="text-3xl font-bold text-center mb-4 text-blue-800 dark:text-blue-300">
              Break Time!
            </h2>
            <div className="text-center mb-6">
              <span className="text-5xl font-mono text-blue-600 dark:text-blue-400">
                {formatTime(breakTime)}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              Take some time to rest your eyes and stretch. Your notes will be waiting for you when you return.
            </p>
            <button
              onClick={cancelBreak}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              End Break Early
            </button>
          </div>
        </div>
      )}
      {/* Main content area: PDFViewer will be rendered full width */}
      <div className="flex flex-col min-h-screen md:ml-64">
        <div className="flex-1 flex flex-col w-full h-[100vh] p-0 m-0">
          <PDFViewer noteUrl={finalPdfUrl} noteTitle={finalNoteTitle} noteId={finalNoteId} />
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Helper for formatting time
function formatTime(timeInSeconds) {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  return [hours, minutes, seconds].map((v) => v.toString().padStart(2, '0')).join(':');
}

export default NoteViewer; 