import React, { useState, useEffect, FC, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaSpinner, FaExclamationTriangle, FaArrowLeft, FaStopwatch } from 'react-icons/fa';
import { Sparkles } from 'lucide-react';

import PDFViewer from '../features/notes/PDFViewer'; // Updated path
import ErrorBoundary from '../components/ErrorBoundary'; // Already TSX
import usePDFNote from '../hooks/usePDFNote'; // Updated path (TS version)
import NoteStudySession from '../features/notes/components/NoteStudySession'; // Updated path
import AIToolsPanel from '../features/notes/components/AIToolsPanel';
import type { Note as CanonicalNote } from '../types/note';
import { useUser } from '../features/user/useUser';

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
  // Panel starts open on desktop where it sits beside the PDF; on small
  // screens it is a slide-over the user summons, so start closed there.
  const [studySessionOpen, setStudySessionOpen] = useState<boolean>(
    () => typeof window === 'undefined' || window.innerWidth >= 1024
  );
  const [aiToolsOpen, setAiToolsOpen] = useState<boolean>(false);

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

        // Fetch just this note — previously this pulled the ENTIRE notes
        // catalogue and searched it client-side, which was slow and expensive
        // on a cold-starting free-tier backend. Falls back to the list only for
        // legacy asset_id links, which GET /notes/:id can't resolve.
        const notesApi = await import('../api/notes');
        const response = await notesApi.callAuthenticatedApi<Note>(`/notes/${id}`, 'GET').catch(() => null);

        if (!isMounted) return;

        if (response?.success && response.data) {
          setNote(response.data as Note);
        } else {
          const listResponse = await notesApi.fetchNotes();
          if (!isMounted) return;
          if (listResponse?.success && Array.isArray(listResponse.data)) {
            foundNote = listResponse.data.find((n: Note) => n && (n._id === id || n.asset_id === id)) || null;
            if (foundNote) {
              setNote(foundNote);
            } else {
              setError('Note not found');
            }
          } else {
            setError(listResponse?.error || 'Failed to fetch note data from server');
          }
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

  // Owner check drives the flashcard editing UI in the AI tools panel. The
  // note's owner arrives as userId, a user id string, or a populated object.
  const { profile } = useUser();
  const noteOwnerId: string | undefined =
    note?.userId ?? (typeof note?.user === 'string' ? note.user : note?.user?._id);
  const isNoteOwner = Boolean(profile?._id && noteOwnerId && profile._id === noteOwnerId);

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
          fileUrl={finalPdfUrl ?? ''}
          noteTitle={finalNoteTitle}
          noteId={finalNoteId}
        />
      </ErrorBoundary>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-100 dark:bg-slate-900">
      {/* Compact toolbar: back, title, study-panel toggle */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shrink-0">
        <button
          onClick={() => navigate('/notes')}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"
          aria-label="Back to notes"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate flex-1">{finalNoteTitle}</h1>
        {finalNoteId && (
          <button
            data-testid="ai-tools-open-btn"
            onClick={() => setAiToolsOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-primary
              hover:bg-primary/10 transition-colors"
            aria-label="Open AI study tools"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI Tools</span>
          </button>
        )}
        <button
          onClick={() => setStudySessionOpen((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            studySessionOpen
              ? 'bg-primary/10 text-primary dark:text-primary-light'
              : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300'
          }`}
          aria-label={studySessionOpen ? 'Hide study panel' : 'Show study panel'}
        >
          <FaStopwatch />
          <span className="hidden sm:inline">Study Session</span>
        </button>
      </div>

      {/* PDF beside the in-flow study panel: no overlap by construction */}
      <div className="flex-1 flex min-h-0">
        <main className="flex-1 min-w-0 relative">{renderMainContent()}</main>
        <NoteStudySession
          /* NoteViewer's local Note is a loose merge of localStorage/API
             shapes; the study panel only reads _id/title/subject from it. */
          note={note as unknown as CanonicalNote | null}
          open={studySessionOpen}
          onClose={() => setStudySessionOpen(false)}
        />
      </div>

      {finalNoteId && (
        <AIToolsPanel
          noteId={String(finalNoteId)}
          initialSummary={note?.aiSummary}
          open={aiToolsOpen}
          onClose={() => setAiToolsOpen(false)}
          isOwner={isNoteOwner}
          initialCards={note?.flashcards ?? []}
        />
      )}
    </div>
  );
};

export default NoteViewer; 