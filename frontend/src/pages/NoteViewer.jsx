import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import PDFViewer from '../components/notes/PDFViewer';
import { fetchNotes } from '../api/notes';

const NoteViewer = () => {
  const { noteId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [note, setNote] = useState(null);
  
  // Get note ID from URL params or search params
  const getNoteIdFromUrl = () => {
    // First try to get from route params
    if (noteId) return noteId;
    
    // Then try to get from query params
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('id');
  };
  
  // Fetch note data
  useEffect(() => {
    const id = getNoteIdFromUrl();
    
    if (!id) {
      setError('No note ID provided');
      setLoading(false);
      return;
    }
    
    const fetchNoteData = async () => {
      try {
        setLoading(true);
        
        // Try to get from localStorage first
        const notesData = localStorage.getItem('notes');
        if (notesData) {
          const parsedNotes = JSON.parse(notesData);
          const foundNote = parsedNotes.find(n => (n._id === id || n.asset_id === id));
          
          if (foundNote) {
            setNote(foundNote);
            setLoading(false);
            return;
          }
        }
        
        // If not found in localStorage, fetch from API
        const response = await fetchNotes();
        
        if (response.success) {
          const foundNote = response.data.find(n => (n._id === id || n.asset_id === id));
          
          if (foundNote) {
            setNote(foundNote);
          } else {
            setError('Note not found');
          }
        } else {
          setError(response.error || 'Failed to fetch note data');
        }
      } catch (err) {
        console.error('Error fetching note:', err);
        setError('Failed to load note. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNoteData();
  }, []);
  
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
              <p className="text-red-600 dark:text-red-200 mb-4">{error}</p>
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
  
  // Get proper note URL and title
  const noteUrl = note.secure_url || note.fileUrl;
  const noteTitle = note.title || note.context?.caption || 'Untitled Note';
  
  // Render PDFViewer
  return <PDFViewer noteUrl={noteUrl} noteTitle={noteTitle} />;
};

export default NoteViewer; 