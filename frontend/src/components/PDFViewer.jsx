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

  // Validate input
  useEffect(() => {
    if (!noteUrl) {
      console.error('PDFViewer received empty URL');
      setError('No PDF URL provided');
      setLoading(false);
    } else {
      console.log('PDFViewer received URL:', noteUrl);
    }
  }, [noteUrl]);

  // Safe URL handling
  const getSafeUrl = (url) => {
    if (!url) return '';
    
    try {
      // Ensure standard URL format
      if (!url.startsWith('http')) {
        url = 'https:' + (url.startsWith('//') ? url : '//' + url);
      }
      
      // Add a cache-busting parameter to avoid caching issues
      const cacheBuster = `cb=${Date.now()}`;
      const separator = url.includes('?') ? '&' : '?';
      const safeUrl = url + separator + cacheBuster;
      
      console.log('Using direct URL with cache buster:', safeUrl);
      return safeUrl;
    } catch (err) {
      console.error('Error creating safe URL:', err);
      return url; // Return original if processing fails
    }
  };

  // Get PDF.js viewer URL with proper scroll mode to ensure multi-page scrolling
  const getPDFjsViewerUrl = (url) => {
    try {
      const safeUrl = getSafeUrl(url);
      if (!safeUrl) return '';
      
      // Use PDF.js with explicit scroll mode parameter (1) to force continuous scrolling
      const viewerUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/web/viewer.html?file=${encodeURIComponent(safeUrl)}&scrollMode=1`;
      console.log('Created viewer URL:', viewerUrl);
      return viewerUrl;
    } catch (err) {
      console.error('Error creating PDF.js viewer URL:', err);
      return ''; // Return empty if processing fails
    }
  };

  // Try to load PDF when component mounts
  useEffect(() => {
    if (noteUrl) {
      setLoading(true);
      setError(null);
      
      console.log('Checking URL access:', noteUrl);
      
      // Simulate checking if URL is valid
      const checkUrl = async () => {
        try {
          const safeUrl = getSafeUrl(noteUrl);
          
          const response = await fetch(safeUrl, { 
            method: 'HEAD',
            mode: 'no-cors', // Try no-cors to at least check if resource exists
            cache: 'no-cache'
          });
          
          // Since no-cors will almost always return opaque response, we continue
          // but we don't actually know if it worked until iframe loads
          console.log('URL check completed, proceeding to load PDF');
          setLoading(false);
        } catch (err) {
          console.warn('Error checking PDF URL, will try direct loading:', err);
          // Don't set error here, let the iframe attempt to load
          setLoading(false);
        }
      };
      
      // Set a timeout to prevent hanging on URL check
      const timeoutId = setTimeout(() => {
        console.log('URL check timed out, proceeding to load PDF directly');
        setLoading(false);
      }, 3000);
      
      // Start the check
      checkUrl().finally(() => clearTimeout(timeoutId));
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