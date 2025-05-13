import React from 'react';
import '../../styles/pdf-thumbnails.css';

interface PDFThumbnailProps {
  url: string;
  alt?: string;
  className?: string;
  onError?: () => void;
}

const PDFThumbnail: React.FC<PDFThumbnailProps> = ({ 
  url, 
  alt = 'PDF preview', 
  className = '',
  onError 
}) => {
  return (
    <div 
      className={`pdf-thumbnail-placeholder ${className}`}
      style={{ 
        width: '100px', 
        height: '140px', 
        backgroundColor: '#e0e0e0', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        border: '1px solid #ccc' 
      }}
      onError={onError}
    >
      <span style={{ color: '#666', fontSize: '12px' }}>PDF</span>
    </div>
  );
};

export default PDFThumbnail; 