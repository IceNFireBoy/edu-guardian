import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaSpinner, FaExclamationTriangle, FaFilePdf } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

/**
 * Enhanced PDF Viewer component
 * Uses PDF.js for consistent cross-platform viewing
 */
const PDFViewer = ({ noteUrl, noteTitle, noteId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Safe URL handling
  const getSafeUrl = (url) => {
    if (!url) return '';
    
    // Ensure standard URL format
    if (!url.startsWith('http')) {
      url = 'https:' + (url.startsWith('//') ? url : '//' + url);
    }
    
    // Add a cache-busting parameter to avoid caching issues
    const cacheBuster = `?t=${Date.now()}`;
    return url + (url.includes('?') ? '&cb=' + cacheBuster : cacheBuster);
  };

  // Get PDF.js viewer URL with proper scroll mode to ensure multi-page scrolling
  const getPDFjsViewerUrl = (url) => {
    const safeUrl = getSafeUrl(url);
    if (!safeUrl) return '';
    
    // Use PDF.js with explicit scroll mode parameter (1) to force continuous scrolling
    // Also pass a fallback URL directly to PDF.js rather than trying to proxy through Mozilla
    return `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/web/viewer.html?file=${encodeURIComponent(safeUrl)}&scrollMode=1`;
  };

  // Try to load PDF when component mounts
  useEffect(() => {
    if (noteUrl) {
      setLoading(true);
      setError(null);
      
      // Simulate checking if URL is valid
      const checkUrl = async () => {
        try {
          const response = await fetch(getSafeUrl(noteUrl), { method: 'HEAD' });
          if (!response.ok) {
            throw new Error(`Failed to access PDF: ${response.status} ${response.statusText}`);
          }
          setLoading(false);
        } catch (err) {
          console.error('Error checking PDF URL:', err);
          setError('Could not access the PDF file. It may be unavailable or restricted.');
          setLoading(false);
        }
      };
      
      checkUrl();
    } else {
      setError('No PDF URL provided');
      setLoading(false);
    }
  }, [noteUrl]);

  // Handle going back
  const goBack = () => {
    navigate('/my-notes');
  };

  // If loading, show spinner
  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-100 dark:bg-slate-900">
        <header className="bg-white dark:bg-slate-800 shadow-md py-3 px-4 w-full z-10">
          <button 
            onClick={goBack}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Go back"
          >
            <FaArrowLeft className="text-gray-700 dark:text-gray-300" />
          </button>
        </header>
        <div className="flex flex-grow items-center justify-center">
          <div className="text-center p-6">
            <FaSpinner className="text-primary dark:text-primary-light text-5xl mx-auto animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading PDF document...</p>
          </div>
        </div>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="flex flex-col h-screen bg-gray-100 dark:bg-slate-900">
        <header className="bg-white dark:bg-slate-800 shadow-md py-3 px-4 w-full z-10">
          <button 
            onClick={goBack}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Go back"
          >
            <FaArrowLeft className="text-gray-700 dark:text-gray-300" />
          </button>
        </header>
        <div className="flex flex-grow items-center justify-center">
          <div className="text-center p-6 max-w-lg">
            <FaExclamationTriangle className="text-red-500 dark:text-red-400 text-5xl mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Error Loading PDF</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={goBack}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              Back to Notes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Everything good, show PDF iframe with PDF.js viewer
  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 shadow-md py-3 px-4 w-full z-10 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={goBack}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors mr-3"
            aria-label="Go back"
          >
            <FaArrowLeft className="text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate max-w-xs sm:max-w-md">
            {noteTitle || 'PDF Document'}
          </h1>
        </div>
        <div>
          <FaFilePdf className="text-primary dark:text-primary-light text-xl" />
        </div>
      </header>
      
      <div className="flex-grow w-full h-full overflow-hidden">
        <iframe
          src={getPDFjsViewerUrl(noteUrl)}
          className="w-full h-full border-none"
          title={noteTitle || "PDF Document"}
          sandbox="allow-scripts allow-same-origin allow-forms"
          loading="eager"
        />
      </div>
    </div>
  );
};

export default PDFViewer; 