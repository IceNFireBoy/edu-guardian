import React from 'react';
import { FaFilePdf, FaCalendarAlt, FaBookOpen } from 'react-icons/fa';

const EnhancedPDFIcon = ({ note, className = '' }) => {
  // Extract title and other metadata
  const title = note.title || 
    (note.context && note.context.caption) || 
    note.public_id?.split('/').pop() || 
    'Untitled Document';
  
  // Format date if available
  const formatDate = () => {
    try {
      if (note.created_at) {
        const date = new Date(note.created_at);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      }
      return '';
    } catch (err) {
      return '';
    }
  };

  // Get subject if available
  const subject = note.subject || '';
  
  return (
    <div className={`enhanced-pdf-preview ${className}`}>
      {/* PDF content area */}
      <div className="pdf-content-area">
        {/* "Biology" badge if subject is available */}
        {subject && (
          <div className="pdf-subject-badge">
            <FaBookOpen className="inline-block mr-1 text-xs" />
            <span>{subject}</span>
          </div>
        )}
        
        {/* Small PDF icon in the top right */}
        <div className="pdf-corner-icon">
          <FaFilePdf />
        </div>
        
        {/* Main title centered */}
        <div className="pdf-preview-title">
          {title}
        </div>
      </div>
      
      <div className="pdf-overlay">
        <div className="pdf-metadata">
          {formatDate() && (
            <div className="pdf-date">
              <FaCalendarAlt className="inline-block mr-1 text-xs" />
              <span>{formatDate()}</span>
            </div>
          )}
          
          <div className="pdf-label">PDF Document</div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPDFIcon; 