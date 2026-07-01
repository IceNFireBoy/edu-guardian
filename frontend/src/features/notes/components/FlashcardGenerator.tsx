import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Loader2, BookOpen } from 'lucide-react';
import { aiApi, GeneratedFlashcard } from '../../../api/ai';
import { useToast } from '../../../hooks/useToast';

interface FlashcardGeneratorProps {
  noteId: string;
}

const difficultyColor: Record<string, string> = {
  easy: 'text-green-600 dark:text-green-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  hard: 'text-red-600 dark:text-red-400',
};

/**
 * Generates flashcards from a note with AI, lets the student flip through them,
 * and adds them to the spaced-repetition review deck. Success/failure feedback
 * is delivered via toasts (failures, incl. quota, are toasted by the API layer).
 */
const FlashcardGenerator: React.FC<FlashcardGeneratorProps> = ({ noteId }) => {
  const toast = useToast();
  const [cards, setCards] = useState<GeneratedFlashcard[]>([]);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    setLoading(true);
    setFlipped(new Set());
    try {
      const data = await aiApi.generateFlashcards(noteId, 8);
      setCards(data.flashcards);
      if (data.flashcards.length > 0) {
        toast.success(`Generated ${data.flashcards.length} flashcards`);
      } else {
        toast.info('No flashcards could be generated from this note.');
      }
    } catch {
      // API layer already toasted the failure.
    } finally {
      setLoading(false);
    }
  };

  const addToDeck = async () => {
    if (cards.length === 0) return;
    setSaving(true);
    try {
      const { added } = await aiApi.addToReviewDeck(
        cards.map((c) => ({ question: c.question, answer: c.answer })),
        noteId
      );
      toast.success(`Added ${added} cards to your review deck`);
    } catch {
      /* toasted by API layer */
    } finally {
      setSaving(false);
    }
  };

  const toggle = (i: number) =>
    setFlipped((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <div data-testid="flashcard-generator" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <Layers className="w-4 h-4 text-primary" /> AI Flashcards
        </h3>
        <div className="flex items-center gap-2">
          {cards.length > 0 && (
            <button
              data-testid="flashcard-add-deck-btn"
              onClick={addToDeck}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-primary
                text-primary hover:bg-primary/10 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              Add to review deck
            </button>
          )}
          <button
            data-testid="flashcard-generate-btn"
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-white
              hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            {cards.length > 0 ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>

      {loading ? (
        <div data-testid="flashcard-skeleton" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-gray-200 dark:bg-slate-700 animate-pulse" />
          ))}
        </div>
      ) : cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence>
            {cards.map((card, i) => (
              <motion.button
                key={i}
                data-testid={`flashcard-${i}`}
                onClick={() => toggle(i)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -2 }}
                className="text-left h-24 p-3 rounded-lg border border-gray-200 dark:border-slate-700
                  bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <span className={`text-[10px] uppercase font-bold ${difficultyColor[card.difficulty] || ''}`}>
                  {card.difficulty}
                </span>
                <p className="mt-1 text-sm text-gray-800 dark:text-gray-100 line-clamp-3">
                  {flipped.has(i) ? card.answer : card.question}
                </p>
                <span className="text-[10px] text-gray-400">
                  {flipped.has(i) ? 'answer — tap for question' : 'tap to reveal answer'}
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Turn this note into a set of study flashcards with AI.
        </p>
      )}
    </div>
  );
};

export default FlashcardGenerator;
