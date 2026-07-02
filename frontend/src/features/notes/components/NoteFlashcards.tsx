import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Shared flip-card deck. A card shows its question; tapping reveals the answer.
 * This is the single flashcard renderer used both for a note's saved cards and
 * for AI-generated cards (FlashcardGenerator), so the question/answer shape
 * matches the backend everywhere.
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

const difficultyColor: Record<string, string> = {
  easy: 'text-green-600 dark:text-green-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  hard: 'text-red-600 dark:text-red-400',
};

export const NoteFlashcards: React.FC<NoteFlashcardsProps> = ({ cards, title = 'Flashcards' }) => {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setFlipped((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

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
          <motion.button
            key={i}
            type="button"
            data-testid={`flashcard-${i}`}
            onClick={() => toggle(i)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -2 }}
            className="text-left min-h-[6rem] p-4 rounded-lg border border-gray-200 dark:border-slate-700
              bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
          >
            {card.difficulty && (
              <span className={`text-[10px] uppercase font-bold ${difficultyColor[card.difficulty] || ''}`}>
                {card.difficulty}
              </span>
            )}
            <p className="mt-1 text-gray-900 dark:text-white">
              {flipped.has(i) ? card.answer : card.question}
            </p>
            <span className="block mt-1 text-[10px] text-gray-400">
              {flipped.has(i) ? 'answer — tap for question' : 'tap to reveal answer'}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default NoteFlashcards;
