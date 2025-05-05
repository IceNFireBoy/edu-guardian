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
      <div className="pdf-icon-container">
        <FaFilePdf className="text-4xl text-red-500" />
      </div>
      
      <div className="pdf-overlay">
        <div className="pdf-title line-clamp-1">{title}</div>
        
        {(subject || formatDate()) && (
          <div className="pdf-metadata">
            {subject && (
              <div className="pdf-subject">
                <FaBookOpen className="inline-block mr-1 text-xs text-red-400" />
                <span>{subject}</span>
              </div>
            )}
            
            {formatDate() && (
              <div className="pdf-date">
                <FaCalendarAlt className="inline-block mr-1 text-xs text-red-400" />
                <span>{formatDate()}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="pdf-page-count">PDF Document</div>
      </div>
    </div>
  );
};

export default EnhancedPDFIcon; 