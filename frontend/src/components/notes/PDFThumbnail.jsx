import React, { useState, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { debug } from '../../components/DebugPanel';
import '../../styles/pdf-thumbnails.css';

// Use pre-built worker and disable workers with disableWorker parameter
pdfjs.GlobalWorkerOptions.workerSrc = null; // Don't use external worker

const PDFThumbnail = ({ url, alt = 'PDF preview', className = '', onError }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let loadingTask = null;

    async function loadPdfThumbnail() {
      if (!url) {
        setError(true);
        setLoading(false);
        if (onError && typeof onError === 'function') {
          onError(new Error('No URL provided'));
        }
        return;
      }

      try {
        setLoading(true);
        
        // Use no-worker solution for CSP compatibility
        loadingTask = pdfjs.getDocument({
          url: url,
          disableWorker: true,
          disableAutoFetch: true,
          disableStream: true,
          cMapUrl: null,
          cMapPacked: true
        });
        
        const pdf = await loadingTask.promise;

        // If component is unmounted, don't continue
        if (!isMounted) return;

        // Get the first page
        const page = await pdf.getPage(1);
        
        // Set scale for thumbnail (adjust as needed for your UI)
        const viewport = page.getViewport({ scale: 0.5 });
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render the PDF page to the canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        
        // Convert canvas to image URL
        if (isMounted) {
          setThumbnailUrl(canvas.toDataURL());
          setLoading(false);
        }
      } catch (err) {
        console.error('Error generating PDF thumbnail:', err);
        debug('PDF thumbnail error:', err.message);
        if (isMounted) {
          setError(true);
          setLoading(false);
          if (onError && typeof onError === 'function') {
            onError(err);
          }
        }
      }
    }

    loadPdfThumbnail();

    // Cleanup function
    return () => {
      isMounted = false;
      if (loadingTask && loadingTask._worker) {
        try {
          loadingTask.destroy();
        } catch (e) {
          console.error("Error destroying PDF task:", e);
        }
      }
    };
  }, [url, onError]);

  if (loading) {
    return (
      <div className={`pdf-loading-spinner ${className}`}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !thumbnailUrl) {
    // Call onError if not already called in the effect
    if (error && onError && typeof onError === 'function') {
      setTimeout(() => onError(new Error('Failed to generate thumbnail')), 0);
    }
    
    return (
      <div className={`pdf-error ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        PDF Preview Unavailable
      </div>
    );
  }

  return (
    <div className={`pdf-thumbnail-container ${className}`}>
      <img 
        src={thumbnailUrl} 
        alt={alt} 
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
};

export default PDFThumbnail; 