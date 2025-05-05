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
      console.log('Note data being processed:', { noteData });
      
      // Handle notes that might be nested (e.g., in a 'resource' or 'data' property)
      const note = noteData.resource || noteData.data || noteData;
      
      // Extract URL from various possible locations in the data
      let url = note.noteUrl || note.fileUrl || note.secure_url || note.url;
      
      // Handle resource_type 'image' with URLs in public_id
      if (!url && note.public_id && note.resource_type === 'image') {
        url = `https://res.cloudinary.com/${note.cloud_name || 'demo'}/${note.resource_type}/${note.type || 'upload'}/${note.public_id}`;
      }
      
      // Try harder to extract from complex nested data structures
      if (!url && note.context && typeof note.context === 'object') {
        url = note.context.url || note.context.secure_url || note.context.fileUrl;
      }
      
      const title = note.noteTitle || note.title || (note.context && note.context.caption) || 'Untitled Note';
      const id = note.noteId || note._id || note.id || note.asset_id;
      
      console.log('Extracted data:', { url, title, id });
      
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