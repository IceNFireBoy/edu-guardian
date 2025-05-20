import { useState, useEffect } from 'react';

// Types for the note
type Note = {
  _id?: string;
  id?: string;
  asset_id?: string;
  title?: string;
  noteTitle?: string;
  fileUrl?: string;
  secure_url?: string;
  url?: string;
  publicId?: string;
  [key: string]: any;
};

// Hook return type
interface UsePDFNoteReturn {
  pdfUrl: string | null;
  noteTitle: string | null;
  noteId: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for extracting PDF information from a note object
 * @param note The note object from which to extract PDF data
 * @returns Object containing PDF URL, note title, note ID, loading state, and any errors
 */
export const usePDFNote = (note: Note | null): UsePDFNoteReturn => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState<string | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!note) {
      setLoading(false);
      return;
    }

    try {
      // Extract PDF URL
      const extractedPdfUrl = note.fileUrl || 
                             note.secure_url || 
                             note.url || 
                             (note.context && note.context.secure_url) || 
                             null;

      // Extract note title
      const extractedNoteTitle = note.title || 
                                note.noteTitle || 
                                (note.context && note.context.caption) || 
                                'Untitled Note';

      // Extract note ID
      const extractedNoteId = note._id || 
                             note.id || 
                             note.asset_id || 
                             null;

      setPdfUrl(extractedPdfUrl);
      setNoteTitle(extractedNoteTitle);
      setNoteId(extractedNoteId);
      setLoading(false);
      
      if (!extractedPdfUrl && note.fileType !== 'image') {
        setError('No valid PDF URL found for this note');
      }
    } catch (err) {
      console.error('Error in usePDFNote:', err);
      setError('An error occurred while processing the note');
      setLoading(false);
    }
  }, [note]);

  return {
    pdfUrl,
    noteTitle,
    noteId,
    loading,
    error
  };
};

export default usePDFNote; 