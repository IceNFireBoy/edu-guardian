import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import NoteFilter from '../features/notes/NoteFilter';
import { useAntiCheating } from '../hooks/useAntiCheating';
import { FaExclamationTriangle, FaSpinner, FaBook } from 'react-icons/fa';

const MyNotes = () => {
  const { RestingModeOverlay } = useAntiCheating();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [componentMounted, setComponentMounted] = useState(false);
  
  // Set up component mounting state
  useEffect(() => {
    try {
      setComponentMounted(true);
      // Simulate loading completion (you might have actual data fetching here)
      const timer = setTimeout(() => {
        setLoading(false);
      }, 800);
      
      return () => clearTimeout(timer);
    } catch (err) {
      console.error('Error during component initialization:', err);
      setError('Failed to initialize the notes page. Please try again.');
      setLoading(false);
    }
  }, []);
  
  // Error fallback component
  const ErrorFallback = ({ message }) => (
    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mx-auto max-w-3xl my-8">
      <div className="flex items-start">
        <FaExclamationTriangle className="text-red-500 dark:text-red-400 mr-3 mt-1 flex-shrink-0 text-xl" />
        <div>
          <h3 className="font-bold text-red-700 dark:text-red-300 mb-1">Error Loading Notes</h3>
          <p className="text-red-600 dark:text-red-200">{message || 'An unexpected error occurred. Please try refreshing the page.'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
  
  // Loading component
  const LoadingFallback = () => (
    <div className="text-center py-12">
      <FaSpinner className="animate-spin text-4xl text-primary mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-300">Loading your notes...</p>
    </div>
  );
  
  // Empty state component
  const EmptyStateFallback = () => (
    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-md my-8 max-w-3xl mx-auto">
      <FaBook className="text-5xl text-gray-400 dark:text-gray-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
        No Notes Available
      </h3>
      <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
        You don't have any notes yet. Try uploading some or adjusting your search filters.
      </p>
      <a 
        href="/donate" 
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
      >
        Upload Notes
      </a>
    </div>
  );
  
  // Main render with try/catch
  try {
    if (!componentMounted) {
      return <LoadingFallback />;
    }
    
    if (error) {
      return <ErrorFallback message={error} />;
    }
    
    if (loading) {
      return <LoadingFallback />;
    }
    
    return (
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <NoteFilter />
        </motion.div>
        
        <RestingModeOverlay />
      </div>
    );
  } catch (err) {
    console.error('Error rendering MyNotes page:', err);
    return <ErrorFallback message="Failed to render the notes page. Please try again later." />;
  }
};

export default MyNotes; 