import React from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

/**
 * PDF Viewer component using @react-pdf-viewer
 */
const PDFViewer = ({ noteUrl, noteTitle, noteId }) => { // Keep noteId prop if needed for other features later
  const navigate = useNavigate();

  // Create instance of the default layout plugin
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // Handle going back
  const goBack = () => {
    navigate('/my-notes');
  };

  // Basic validation
  if (!noteUrl) {
    console.error('PDFViewer: Missing noteUrl prop.');
    return (
      <div className="flex flex-col h-screen items-center justify-center text-center p-6 bg-gray-100 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Error Loading PDF</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">No PDF URL was provided to the viewer component.</p>
        <button
          onClick={goBack}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          Back to Notes
        </button>
      </div>
    );
  }

  console.log(`PDFViewer: Rendering PDF for URL: ${noteUrl}`);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-slate-900">
      {/* Header (similar to the old one) */}
      <header className="bg-white dark:bg-slate-800 shadow-md py-3 px-4 w-full z-10 flex items-center justify-between flex-shrink-0">
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
        {/* Optional: Add other header elements if needed */}
      </header>
      
      {/* PDF Viewer container */}
      <div className="flex-grow w-full h-full overflow-hidden">
        <Worker workerUrl={workerSrc}>
          <Viewer 
            fileUrl={noteUrl} 
            plugins={[defaultLayoutPluginInstance]} 
          />
        </Worker>
      </div>
    </div>
  );
};

export default PDFViewer; 