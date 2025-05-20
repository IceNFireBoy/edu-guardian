import React, { useState, useEffect, FC, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaSpinner, FaExclamationTriangle, FaCoffee, FaTimes } from 'react-icons/fa';

import PDFViewer from '../features/notes/PDFViewer'; // Updated path
import ErrorBoundary from '../components/ErrorBoundary'; // Already TSX
import usePDFNote from '../hooks/usePDFNote'; // Updated path (TS version)
import NoteStudySession from '../features/notes/components/NoteStudySession'; // Updated path
import Sidebar from '../components/layout/Sidebar'; // Updated path to TSX version

// Assuming Note type might be similar to what useNote.ts uses, or define a local one
// For simplicity, using a local one here based on usage.
interface Note {
  _id: string;
  asset_id?: string; // Can be either _id or asset_id
  title?: string | null;
  noteTitle?: string | null;
  fileUrl?: string | null;
  secure_url?: string | null;
  url?: string | null;
  subject?: string;
  description?: string;
  fileType?: string;
  // Add other fields like context, public_id etc. if they are directly accessed on `note`
  [key: string]: any; // To accommodate various shapes from localStorage/API
}

interface BreakState {
  isBreakActive: boolean;
  breakTime: number;
  cancelBreak: () => void;
}

// Utility function to ensure string values
const ensureString = (value: any, defaultValue = ''): string => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') return value;
  try {
    return String(value);
  } catch (err) {
    console.error('Error converting value to string:', err);
    return defaultValue;
  }
};

const NoteViewer: FC = () => {
  const { noteId: paramNoteId } = useParams<{ noteId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [studySessionOpen, setStudySessionOpen] = useState(true); // For the NoteStudySession panel

  // Placeholder for break state logic, to be refined
  const [breakState, setBreakState] = useState<BreakState>({
    isBreakActive: false,
    breakTime: 0,
    cancelBreak: () => setBreakState(prev => ({ ...prev, isBreakActive: false, breakTime: 0 })),
  });

  const getNoteIdFromUrl = useCallback((): string | null => {
    try {
      if (paramNoteId) {
        return paramNoteId;
      }
      const searchParams = new URLSearchParams(location.search);
      const queryId = searchParams.get('id');
      if (queryId) {
        return queryId;
      }
      console.warn("No Note ID found in URL params or query string.");
      return null;
    } catch (err) {
      console.error('Error getting note ID from URL:', err);
      return null;
    }
  }, [paramNoteId, location.search]);

  useEffect(() => {
    let isMounted = true;
    const fetchNoteData = async () => {
      setLoading(true);
      setError(null);
      setNote(null);

      const id = getNoteIdFromUrl();
      if (!id) {
        if (isMounted) {
          setError('No note ID provided in the URL');
          setLoading(false);
        }
        return;
      }

      try {
        let foundNote: Note | null = null;
        try {
          const savedNotes = localStorage.getItem('notes');
          if (savedNotes) {
            const noteDataArray: Note[] = JSON.parse(savedNotes);
            if (Array.isArray(noteDataArray)) {
              foundNote = noteDataArray.find(n => n && (n._id === id || n.asset_id === id)) || null;
              if (foundNote && isMounted) {
                setNote(foundNote);
                setLoading(false);
                return;
              }
            }
          }
        } catch (localStorageError) {
          console.error('Error reading notes from localStorage:', localStorageError);
        }

        // Dynamically import fetchNotes to avoid issues if it has side effects or complex deps
        const notesApi = await import('../api/notes'); 
        const response = await notesApi.fetchNotes(); // Assuming fetchNotes is exported

        if (!isMounted) return;

        if (response && response.success && Array.isArray(response.data)) {
          foundNote = response.data.find((n: Note) => n && (n._id === id || n.asset_id === id)) || null;
          if (foundNote) {
            setNote(foundNote);
          } else {
            setError('Note not found');
          }
        } else {
          setError(response?.error || 'Failed to fetch note data from server');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load note data. Please check connection or try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNoteData();

    return () => {
      isMounted = false;
    };
  }, [getNoteIdFromUrl]);

  const { pdfUrl: hookPdfUrl, noteTitle: hookNoteTitle, noteId: hookNoteId, loading: hookLoading, error: hookError } = usePDFNote(note);

  const isLoading = loading || (note && hookLoading);
  const errorMessage = error || hookError;

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
  
  if (!note && !isLoading && !errorMessage) { // Check after loading and no error
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

  const finalPdfUrl = hookPdfUrl || (note && (note.secure_url || note.fileUrl || note.url)) || null;
  const finalNoteTitle = hookNoteTitle || (note && (note.title || note.noteTitle || (note.context && note.context.caption))) || 'Untitled Note';
  const finalNoteId = hookNoteId || (note && (note._id || note.id || note.asset_id)) || null;

  // Break overlay
  if (breakState.isBreakActive) {
    return (
      <div className="fixed inset-0 bg-blue-900/90 flex items-center justify-center z-[100]"><div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md text-center"><div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4"><FaCoffee className="text-3xl text-blue-600 dark:text-blue-400" /></div><h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Taking a Break</h2><p className="text-gray-600 dark:text-gray-300 mb-6">Study session paused. Time remaining: {formatTime(breakState.breakTime)}</p><button onClick={breakState.cancelBreak} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center mx-auto"><FaTimes className="mr-2" />End Break</button></div></div>
    );
  }

  const ErrorFallbackPDF: FC<{ error: Error }> = ({ error: pdfError }) => (
    <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-center">
      <FaExclamationTriangle className="text-red-500 dark:text-red-400 text-3xl mx-auto mb-2" />
      <h3 className="text-red-700 dark:text-red-300 font-semibold mb-1">PDF Load Error</h3>
      <p className="text-red-600 dark:text-red-200 text-sm">{ensureString(pdfError?.message, 'Could not load PDF.')}</p>
    </div>
  );

  const renderMainContent = () => {
    if (!finalPdfUrl && note?.fileType !== 'image') { // Adjusted condition
      return (
        <div className="flex items-center justify-center h-full"><div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg shadow"><FaExclamationTriangle className="text-yellow-500 dark:text-yellow-400 text-3xl mx-auto mb-3" /><h3 className="font-semibold text-yellow-700 dark:text-yellow-300">No Viewable Content</h3><p className="text-yellow-600 dark:text-yellow-200 text-sm">A viewable PDF URL could not be found for this note.</p></div></div>
      );
    }
    // Handle image display if it's an image type (simplified)
    if (note?.fileType === 'image' && finalPdfUrl) {
        return <img src={finalPdfUrl} alt={finalNoteTitle || 'Note Image'} className="max-w-full max-h-[calc(100vh-100px)] object-contain mx-auto" />;
    }

    return (
      <ErrorBoundary fallback={<ErrorFallbackPDF error={new Error('PDF viewer crashed')} />}>
        <PDFViewer 
          noteUrl={finalPdfUrl} 
          noteTitle={finalNoteTitle || undefined} // Pass undefined if null
          noteId={finalNoteId ? String(finalNoteId) : undefined} 
        />
      </ErrorBoundary>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="bg-white dark:bg-slate-800 shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 truncate max-w-md">{finalNoteTitle}</h1>
          <button onClick={() => setStudySessionOpen(!studySessionOpen)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary">
            <FaCoffee className="text-gray-600 dark:text-gray-300" />
          </button>
        </header>
        <main className="flex-1 p-0 overflow-hidden relative">
          <div className="h-full w-full">{renderMainContent()}</div>
        </main>
      </div>
      {note && studySessionOpen && (
        <NoteStudySession 
          note={note} 
          className={`w-80 xl:w-96 bg-white dark:bg-slate-800 shadow-lg border-l dark:border-slate-700 fixed top-0 right-0 h-full z-40 transform transition-transform duration-300 ease-in-out ${studySessionOpen ? 'translate-x-0' : 'translate-x-full'}`}
          onClose={() => setStudySessionOpen(false)} 
          onBreakStart={(time: number) => setBreakState({ 
            isBreakActive: true, 
            breakTime: time, 
            cancelBreak: () => setBreakState(prev => ({...prev, isBreakActive: false, breakTime: 0}))
          })} 
        />
      )}
    </div>
  );
};

// Helper function (remains JS for now, or can be typed)
function formatTime(timeInSeconds: number): string {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export default NoteViewer; 