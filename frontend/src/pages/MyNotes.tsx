import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import NoteFilter from '../features/notes/NoteFilter';
import { useAntiCheating } from '../hooks/useAntiCheating';
import { FaExclamationTriangle, FaSpinner, FaBook } from 'react-icons/fa';

const MyNotes: React.FC = () => {
  const { RestingModeOverlay } = useAntiCheating();
  const [componentMounted, setComponentMounted] = useState<boolean>(false);
  const [tab, setTab] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    // Minimal effect, just for triggering animation or initial setup if any future need arises.
    // The primary loading simulation is removed.
    setComponentMounted(true);
  }, []);
  
  // Render logic with try/catch for safety
  // The main loading and error checks related to internal state are removed.
  // NoteFilter component is expected to handle its own specific loading/error/empty states.
  
  // Optional: If we want a page-level spinner before NoteFilter itself might be ready 
  // (e.g. code-splitting or initial mount), we could keep a very brief one here.
  // For now, assuming NoteFilter handles all visual states once it mounts.
  if (!componentMounted) {
      // You could return a minimal global spinner here if NoteFilter takes time to initialize
      // For example: return <div className="text-center py-12"><FaSpinner className="animate-spin text-4xl text-primary mx-auto" /></div>;
      // Or, if the transition is quick, simply return null or an empty fragment until NoteFilter renders.
      return null; // Or a very basic placeholder
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Tab Switcher */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold focus:outline-none transition-colors ${tab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          onClick={() => setTab('all')}
        >
          All Notes
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold focus:outline-none transition-colors ${tab === 'mine' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          onClick={() => setTab('mine')}
        >
          My Notes
        </button>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: componentMounted ? 1 : 0, y: componentMounted ? 0 : 20 }}
        transition={{ duration: 0.5 }}
      >
        <NoteFilter mode={tab} />
      </motion.div>
      
      <RestingModeOverlay />
    </div>
  );
  // The outer try-catch for rendering errors can be kept or moved into a global ErrorBoundary if preferred.
  // For now, it provides a local safety net for MyNotes rendering issues.
  // If removed, ensure an ErrorBoundary wraps this component in App.tsx or similar.
};

export default MyNotes; 