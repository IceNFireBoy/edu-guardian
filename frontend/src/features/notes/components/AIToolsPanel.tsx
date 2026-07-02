import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import AISummarizer from './AISummarizer';
import FlashcardGenerator from './FlashcardGenerator';
import AIQuiz from './AIQuiz';

interface AIToolsPanelProps {
  noteId: string;
  initialSummary?: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Slide-over panel that hosts the AI study tools (summary, flashcards, quiz) for
 * a single note. Animated in/out with Framer Motion.
 */
const AIToolsPanel: React.FC<AIToolsPanelProps> = ({ noteId, initialSummary, open, onClose }) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="ai-tools-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />
          <motion.aside
            key="ai-tools-panel"
            data-testid="ai-tools-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed top-0 right-0 h-full w-full max-w-md z-50 bg-white dark:bg-slate-900
              border-l border-gray-200 dark:border-slate-700 shadow-xl flex flex-col"
          >
            <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <Sparkles className="w-5 h-5 text-primary" /> AI Study Tools
              </h2>
              <button
                onClick={onClose}
                aria-label="Close AI tools"
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <AISummarizer noteId={noteId} initialSummary={initialSummary} />
              <hr className="border-gray-100 dark:border-slate-800" />
              <FlashcardGenerator noteId={noteId} />
              <hr className="border-gray-100 dark:border-slate-800" />
              <AIQuiz noteId={noteId} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIToolsPanel;
