import React from 'react';
import { motion } from 'framer-motion';
import NoteFilter from '../features/notes/NoteFilter';
import { useAntiCheating } from '../hooks/useAntiCheating';

const MyNotes = () => {
  const { RestingModeOverlay } = useAntiCheating();
  
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
};

export default MyNotes; 