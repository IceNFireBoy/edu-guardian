import React, { useEffect, useState } from 'react';
import { Layers, Loader2, BookOpen } from 'lucide-react';
import { aiApi, GeneratedFlashcard } from '../../../api/ai';
import { useToast } from '../../../hooks/useToast';
import { NoteFlashcards } from './NoteFlashcards';
import { readLocalCache, writeLocalCache, DAY_MS } from '../../../utils/localCache';

interface FlashcardGeneratorProps {
  noteId: string;
}

/**
 * Generates flashcards from a note with AI, lets the student flip through them,
 * and adds them to the spaced-repetition review deck. Success/failure feedback
 * is delivered via toasts (failures, incl. quota, are toasted by the API layer).
 */
const FlashcardGenerator: React.FC<FlashcardGeneratorProps> = ({ noteId }) => {
  const toast = useToast();
  const cacheKey = `eg_ai_flashcards_${noteId}`;
  const [cards, setCards] = useState<GeneratedFlashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reuse cards generated in the last 24h — reopening the panel costs zero
  // API calls (protects the AI quota and rate limits from repeat views).
  useEffect(() => {
    const cached = readLocalCache<GeneratedFlashcard[]>(cacheKey);
    setCards(cached && cached.length > 0 ? cached : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  const generate = async () => {
    setLoading(true);
    try {
      const data = await aiApi.generateFlashcards(noteId, 8);
      setCards(data.flashcards);
      if (data.flashcards.length > 0) {
        writeLocalCache(cacheKey, data.flashcards, DAY_MS);
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
        // Reuse the shared flip-card deck so there is one flashcard renderer.
        <NoteFlashcards cards={cards} title="" />
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Turn this note into a set of study flashcards with AI.
        </p>
      )}
    </div>
  );
};

export default FlashcardGenerator;
