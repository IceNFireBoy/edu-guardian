import React, { useState, useEffect } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
// Bundle the worker that ships with the installed pdfjs-dist so the API and
// worker versions always match; without a worker the viewer crashes with
// 'No "GlobalWorkerOptions.workerSrc" specified'.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface PDFViewerProps {
  fileUrl: string;
  noteTitle?: string;
  noteId?: string;
  onLoad?: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl, noteTitle, noteId, onLoad }) => {
  const [internalFileUrl, setInternalFileUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    if (typeof fileUrl === 'string' && fileUrl.startsWith('http')) {
      setInternalFileUrl(fileUrl);
      setHasError(false);
      if (onLoad) {
        onLoad();
      }
    } else if (fileUrl !== undefined && fileUrl !== null) {
      console.error('[PDFViewer] Received invalid fileUrl:', fileUrl);
      setHasError(true);
      setInternalFileUrl(null);
    }
  }, [fileUrl, onLoad]);

  if (hasError) {
    return (
      <div className="p-5 text-center text-red-500">
        <h1 className="text-xl font-bold mb-2">PDF Viewer Error</h1>
        <p className="mb-2">An invalid PDF URL was processed by the viewer.</p>
        <p className="text-sm">Received fileUrl: {String(fileUrl)}</p>
      </div>
    );
  }

  if (!internalFileUrl) {
    return (
      <div className="p-5 text-center text-blue-500">
        <h1 className="text-xl font-bold mb-2">Loading PDF...</h1>
        <p className="mb-2">Waiting for a valid PDF URL to be processed...</p>
        <p className="text-sm">Received fileUrl: {String(fileUrl)}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Worker workerUrl={pdfWorkerUrl}>
        <Viewer
          fileUrl={internalFileUrl}
          plugins={[defaultLayoutPluginInstance]}
        />
      </Worker>
    </div>
  );
};

export default PDFViewer; 