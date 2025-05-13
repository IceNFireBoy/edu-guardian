import React from 'react';

// This was the simpler LoadingSpinner from components/ui/LoadingSpinner.jsx
// Moved here as part of the TS refactor and consolidation effort.
// The more feature-rich spinner in components/LoadingSpinner.jsx (soon .tsx) is preferred.

const LoadingSpinner = ({ className }) => (
  <div className={`flex justify-center items-center ${className}`}>
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export default LoadingSpinner; 