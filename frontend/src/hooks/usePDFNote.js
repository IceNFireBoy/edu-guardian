import { useState, useEffect } from 'react';

/**
 * Custom hook to handle PDF note data
 * Extracts and validates PDF URL and metadata
 */
const usePDFNote = (noteData) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteId, setNoteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset state and do nothing if noteData is null or undefined
    if (!noteData) {
      setPdfUrl(null);
      setNoteTitle('');
      setNoteId(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Clear previous errors before processing new data
    setError(null);
    
    try {
      console.log('usePDFNote: Processing provided note data...', { noteData: 'Exists' });
      
      // Handle notes that might be nested
      const note = noteData.resource || noteData.data || noteData;
      
      // Extract URL
      let url = note.noteUrl || note.fileUrl || note.secure_url || note.url;
      
      // Handle image type with public_id
      if (!url && note.public_id && note.resource_type === 'image') {
        url = `https://res.cloudinary.com/${note.cloud_name || 'demo'}/${note.resource_type}/${note.type || 'upload'}/${note.public_id}`;
      }
      
      // Handle nested context
      if (!url && note.context && typeof note.context === 'object') {
        url = note.context.url || note.context.secure_url || note.context.fileUrl;
      }
      
      const title = note.noteTitle || note.title || (note.context && note.context.caption) || 'Untitled Note';
      const id = note.noteId || note._id || note.id || note.asset_id;
      
      console.log('usePDFNote: Extracted data:', { url: url ? 'Exists' : 'null', title, id: id ? 'Exists' : 'null' });
      
      // Validate extracted URL
      if (!url) {
        console.error('usePDFNote: No valid URL found after extraction.');
        setError('No valid URL found in the note data');
        setPdfUrl(null);
        setNoteTitle('');
        setNoteId(null);
        setLoading(false);
        return;
      }

      // Fix Cloudinary URLs if needed
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (url.includes('cloudinary.com') || url.startsWith('//')) {
          url = 'https:' + (url.startsWith('//') ? url : '//' + url);
          console.log('usePDFNote: Fixed URL format:', url);
        }
      }
      
      // Apply cache-busting
      if (url.includes('cloudinary.com')) {
        const timestamp = Date.now();
        url = url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
        console.log('usePDFNote: Applied cache-busting URL:', url);
      }

      // Set successful state
      setPdfUrl(url);
      setNoteTitle(title);
      setNoteId(id);
      setError(null);
      setLoading(false);
      console.log('usePDFNote: Processing successful.');
      
    } catch (err) {
      console.error('usePDFNote: Error parsing PDF note data:', err);
      setError('Failed to process note data');
      setPdfUrl(null);
      setNoteTitle('');
      setNoteId(null);
      setLoading(false);
    }
  }, [noteData]);

  return { pdfUrl, noteTitle, noteId, loading, error };
};

export default usePDFNote; 