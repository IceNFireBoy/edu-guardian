import { useEffect, useState } from 'react';

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
    if (!noteData) {
      setError('No note data provided');
      setLoading(false);
      return;
    }

    try {
      // Extract URL from various possible locations in the data
      let url = noteData.noteUrl || noteData.fileUrl || noteData.secure_url || noteData.url;
      const title = noteData.noteTitle || noteData.title || 'Untitled Note';
      const id = noteData.noteId || noteData._id || noteData.id || noteData.asset_id;
      
      // Basic URL validation
      if (!url) {
        setError('No valid URL found in the note data');
        setLoading(false);
        return;
      }

      // Fix Cloudinary URLs if needed
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (url.includes('cloudinary.com') || url.startsWith('//')) {
          url = 'https:' + (url.startsWith('//') ? url : '//' + url);
          console.log('Fixed URL format:', url);
        }
      }
      
      // Special handling for URLs with resource IDs that may have been deleted
      if (url.includes('cloudinary.com')) {
        // Attempt to construct a cache-buster URL variant
        const timestamp = Date.now();
        url = url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
        console.log('Using cache-busting URL:', url);
      }

      setPdfUrl(url);
      setNoteTitle(title);
      setNoteId(id);
      setLoading(false);
    } catch (err) {
      console.error('Error parsing PDF note data:', err);
      setError('Failed to process note data');
      setLoading(false);
    }
  }, [noteData]);

  return { pdfUrl, noteTitle, noteId, loading, error };
};

export default usePDFNote; 