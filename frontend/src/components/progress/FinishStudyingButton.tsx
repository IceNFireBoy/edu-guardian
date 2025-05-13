import React, { useState, useEffect, useRef } from 'react';
import { FaFlag, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useClickAway } from '@uidotdev/usehooks'; // Hook to close dialog on outside click

// --- Types & Interfaces ---

type FeedbackEmoji = '🤓' | '🤔' | '❗' | string; // Allow string for potential custom emojis

interface EmojiOption {
  emoji: FeedbackEmoji;
  meaning: string;
}

interface CompletionData {
  noteId: string;
  timeSpentMinutes: number;
  feedback: FeedbackEmoji;
  subject: string;
}

interface FinishStudyingButtonProps {
  noteId: string;
  onFinish: (data: CompletionData) => void; // Callback when feedback is selected
  initialStartTime?: number; // Optional start time timestamp (Date.now())
  subject?: string;
}

// --- Local Storage Utility (can be moved to a separate file) ---

const LOCAL_STORAGE_KEY = 'completedNotesData_v1';

interface StoredCompletionData extends CompletionData {
  completedAt: string; // ISO date string
}

const saveCompletionToLocalStorage = (data: CompletionData) => {
  try {
    const storedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]') as StoredCompletionData[];
    const existingIndex = storedData.findIndex(item => item.noteId === data.noteId);
    
    const newEntry: StoredCompletionData = {
      ...data,
      completedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      storedData[existingIndex] = newEntry;
    } else {
      storedData.push(newEntry);
    }
    
    // Optional: Limit stored data size if needed
    // const limitedData = storedData.slice(-100); // Keep latest 100

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedData));
  } catch (error) {
    console.error('Error saving completion data to localStorage:', error);
  }
};

// --- Component ---

const FinishStudyingButton: React.FC<FinishStudyingButtonProps> = ({ 
  noteId, 
  onFinish, 
  initialStartTime, 
  subject = 'Uncategorized' 
}) => {
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [startTime] = useState<number>(initialStartTime || Date.now());
  
  const emojiOptions: EmojiOption[] = [
    { emoji: "🤓", meaning: "Got it!" },
    { emoji: "🤔", meaning: "Unsure" },
    { emoji: "❗", meaning: "Need Review" }
  ];
  
  const feedbackRef = useClickAway<HTMLDivElement>(() => {
    setShowFeedbackDialog(false);
  });

  const calculateTimeSpentMinutes = (): number => {
    const now = Date.now();
    const timeSpentMs = now - startTime;
    return Math.max(1, Math.round(timeSpentMs / (1000 * 60))); // Min 1 minute, rounded
  };
  
  const handleFinishClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent outside click handler if button is inside ref
    setShowFeedbackDialog(true);
  };
  
  const handleEmojiSelect = (emoji: FeedbackEmoji) => {
    const timeSpentMinutes = calculateTimeSpentMinutes();
    
    // Simple subject standardization example
    let standardizedSubject = subject;
    if (subject.toLowerCase().includes('biology')) {
      standardizedSubject = 'Biology';
    } else if (subject.toLowerCase().includes('chemistry')) {
        standardizedSubject = 'Chemistry';
    }
    // Add more rules as needed

    const completionData: CompletionData = {
      noteId,
      timeSpentMinutes,
      feedback: emoji,
      subject: standardizedSubject,
    };
    
    saveCompletionToLocalStorage(completionData);
    
    if (typeof onFinish === 'function') {
      onFinish(completionData);
    }
    
    setShowFeedbackDialog(false);
  };
  
  return (
    <div className="relative">
      <button
        onClick={handleFinishClick}
        className="btn btn-success btn-sm flex items-center shadow-sm"
        aria-haspopup="dialog"
        aria-expanded={showFeedbackDialog}
      >
        <FaFlag className="mr-2" />
        Finish Studying
      </button>
      
      <AnimatePresence>
        {showFeedbackDialog && (
          <motion.div
            ref={feedbackRef} // Attach ref for click away detection
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute z-50 top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-64 border border-gray-200 dark:border-gray-700"
            role="dialog"
            aria-labelledby="feedback-title"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 id="feedback-title" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Rate Understanding
              </h3>
              <button 
                onClick={() => setShowFeedbackDialog(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full -mr-1"
                aria-label="Close feedback dialog"
              >
                <FaTimes />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {emojiOptions.map((option) => (
                <motion.button
                  key={option.emoji}
                  onClick={() => handleEmojiSelect(option.emoji)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`Select feedback: ${option.meaning}`}
                >
                  <span className="text-2xl mb-1">{option.emoji}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 text-center">{option.meaning}</span>
                </motion.button>
              ))}
            </div>
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
               Time: {calculateTimeSpentMinutes()} min
             </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinishStudyingButton; 