import React from 'react';
import { FaFilePdf, FaCalendarAlt, FaBookOpen } from 'react-icons/fa';
import { Note } from './noteTypes';
import { getSubjectColor } from './NoteCard';

interface EnhancedPDFIconProps {
  note: Note;
  className?: string;
}

const EnhancedPDFIcon: React.FC<EnhancedPDFIconProps> = ({ note, className = '' }) => {
  // Extract title and other metadata
  const title = note.title || 'Untitled Document';
  
  // Format date if available
  const formatDate = (): string => {
    try {
      if (note.uploadDate) {
        const date = new Date(note.uploadDate);
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
      return '';
    } catch (err) {
      return '';
    }
  };

  // Get subject if available
  const subject = note.subject || '';
  // Get the color theme for the subject
  const colorTheme = getSubjectColor(subject);
  
  return (
    <div className={`enhanced-pdf-preview ${className}`}>
      {/* PDF content area */}
      <div className="pdf-content-area">
        {/* Subject badge with appropriate color */}
        {subject && (
          <div className={`pdf-subject-badge ${colorTheme.light} ${colorTheme.text} ${colorTheme.dark} ${colorTheme.darkText}`}>
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