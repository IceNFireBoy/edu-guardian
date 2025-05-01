import React from 'react';

// A minimal fallback component with no dependencies
const Fallback = () => {
  return (
    <div style={{
      padding: '20px',
      margin: '50px auto',
      maxWidth: '600px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f9fafb', 
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px' }}>
        EduGuardian
      </h1>
      <p style={{ fontSize: '16px', color: '#4b5563', marginBottom: '20px' }}>
        We're experiencing some technical difficulties. Please try:
      </p>
      <ul style={{ 
        textAlign: 'left', 
        margin: '20px auto', 
        maxWidth: '400px', 
        color: '#4b5563',
        fontSize: '14px',
        lineHeight: '1.5'
      }}>
        <li>Refreshing the page</li>
        <li>Clearing your browser cache</li>
        <li>Checking your internet connection</li>
        <li>Trying again in a few minutes</li>
      </ul>
      <button 
        onClick={() => window.location.reload()} 
        style={{
          padding: '8px 16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Reload Page
      </button>
    </div>
  );
};

export default Fallback; 