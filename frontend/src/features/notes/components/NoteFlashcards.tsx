import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Shared flip-card deck with a real 3D flip (perspective + rotateY, two faces).
 * Used for a note's saved cards and AI-generated cards alike, so the
 * question/answer shape matches the backend everywhere.
 */
export interface FlashcardItem {
  question: string;
  answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface NoteFlashcardsProps {
  cards: FlashcardItem[];
  /** Optional heading; pass "" to hide it (e.g. when embedded under another header). */
  title?: string;
}

const difficultyTheme: Record<string, { chip: string; edge: string }> = {
  easy: { chip: 'bg-green-500/15 text-green-600 dark:text-green-400', edge: 'from-green-400/60' },
  medium: { chip: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400', edge: 'from-yellow-400/60' },
  hard: { chip: 'bg-red-500/15 text-red-600 dark:text-red-400', edge: 'from-red-400/60' },
};

const FlipCard: React.FC<{ card: FlashcardItem; index: number }> = ({ card, index }) => {
  const [flipped, setFlipped] = useState(false);
  const theme = difficultyTheme[card.difficulty ?? ''] ?? {
    chip: 'bg-primary/10 text-primary',
    edge: 'from-primary/50',
  };

  const face =
    'absolute inset-0 rounded-xl border border-gray-200 dark:border-slate-700 ' +
    'bg-white dark:bg-slate-800 p-4 flex flex-col overflow-hidden';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -3 }}
      className="h-44 cursor-pointer select-none"
      style={{ perspective: 1200 }}
      onClick={() => setFlipped((f) => !f)}
      data-testid={`flashcard-${index}`}
      role="button"
      tabIndex={0}
      aria-label={flipped ? 'Show question' : 'Show answer'}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0.2, 0.2, 1] }}
      >
        {/* Front — question */}
        <div className={face} style={{ backfaceVisibility: 'hidden' }}>
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.edge} to-transparent`} />
          <div className="flex items-center justify-between mb-2">
            {card.difficulty && (
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${theme.chip}`}>
                {card.difficulty}
              </span>
            )}
            <span className="text-[10px] text-gray-400 ml-auto">Q</span>
          </div>
          <p className="flex-1 text-sm font-medium text-gray-900 dark:text-white overflow-y-auto">
            {card.question}
          </p>
          <span className="mt-2 text-[10px] text-gray-400">tap to flip</span>
        </div>

        {/* Back — answer */}
        <div
          className={face}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 to-transparent" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              answer
            </span>
          </div>
          <p className="flex-1 text-sm text-gray-700 dark:text-gray-200 overflow-y-auto">
            {card.answer}
          </p>
          <span className="mt-2 text-[10px] text-gray-400">tap to flip back</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const NoteFlashcards: React.FC<NoteFlashcardsProps> = ({ cards, title = 'Flashcards' }) => {
  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">No flashcards available</div>
    );
  }

  return (
    <div className="space-y-4">
      {title ? <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3> : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card, i) => (
          <FlipCard key={`${i}-${card.question.slice(0, 24)}`} card={card} index={i} />
        ))}
      </div>
    </div>
  );
};

export default NoteFlashcards;
