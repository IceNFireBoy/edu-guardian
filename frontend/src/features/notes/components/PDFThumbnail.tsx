import React, { useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// Bundle the worker from the installed pdfjs-dist (react-pdf pins the same
// version) instead of relying on a CDN at runtime.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PDFThumbnailProps {
  fileUrl: string;
  onError?: () => void;
  className?: string;
}

export const PDFThumbnail: React.FC<PDFThumbnailProps> = ({
  fileUrl,
  onError,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleError = () => {
      if (onError) {
        onError();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('error', handleError);
      return () => {
        container.removeEventListener('error', handleError);
      };
    }
  }, [onError]);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <Document
        file={fileUrl}
        loading={<div className="w-full h-full bg-gray-100 animate-pulse" />}
        error={
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-500">Failed to load PDF</span>
          </div>
        }
      >
        <Page
          pageNumber={1}
          width={containerRef.current?.clientWidth}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="w-full h-full object-cover"
        />
      </Document>
    </div>
  );
}; 