import React from 'react';
import { motion } from 'framer-motion';
import NoteUploader from '../features/notes/NoteUploader';
import { useAntiCheating } from '../hooks/useAntiCheating';

const Donate: React.FC = () => {
  const { RestingModeOverlay } = useAntiCheating();
  
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <NoteUploader />
      </motion.div>
      
      <RestingModeOverlay />
    </div>
  );
};

export default Donate; 