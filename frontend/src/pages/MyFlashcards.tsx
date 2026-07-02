import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Trash2, Loader2, GraduationCap, RotateCcw } from 'lucide-react';
import { aiApi, DueCard } from '../api/ai';
import { useToast } from '../hooks/useToast';

/**
 * The user's personal flashcard deck (spaced repetition).
 * - Review mode: due cards one at a time; grading Again/Hard/Good/Easy maps to
 *   SM-2 quality 1/3/4/5 so missed cards resurface sooner.
 * - Deck view: create standalone cards (not tied to any note) and prune old ones.
 */

const GRADES: Array<{ label: string; quality: number; classes: string }> = [
  { label: 'Again', quality: 1, classes: 'bg-red-500/10 text-red-600 border-red-300 dark:border-red-700' },
  { label: 'Hard', quality: 3, classes: 'bg-yellow-500/10 text-yellow-600 border-yellow-300 dark:border-yellow-700' },
  { label: 'Good', quality: 4, classes: 'bg-green-500/10 text-green-600 border-green-300 dark:border-green-700' },
  { label: 'Easy', quality: 5, classes: 'bg-blue-500/10 text-blue-600 border-blue-300 dark:border-blue-700' },
];

const MyFlashcards: React.FC = () => {
  const toast = useToast();
  const [deck, setDeck] = useState<DueCard[]>([]);
  const [due, setDue] = useState<DueCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [deckRes, dueRes] = await Promise.all([aiApi.getDeck(), aiApi.getDueCards()]);
      setDeck(deckRes.cards);
      setDue(dueRes);
    } catch {
      /* toasted by API layer */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const currentCard = due[0];

  const grade = async (quality: number) => {
    if (!currentCard) return;
    setBusy(true);
    try {
      await aiApi.reviewCard(currentCard._id, quality);
      setDue((d) => d.slice(1));
      setRevealed(false);
      setReviewedCount((n) => n + 1);
    } catch {
      /* toasted by API layer */
    } finally {
      setBusy(false);
    }
  };

  const addCard = async () => {
    if (!question.trim() || !answer.trim()) return;
    setBusy(true);
    try {
      await aiApi.addToReviewDeck([{ question: question.trim(), answer: answer.trim() }]);
      toast.success('Card added to your deck');
      setQuestion('');
      setAnswer('');
      await load();
    } catch {
      /* toasted */
    } finally {
      setBusy(false);
    }
  };

  const removeCard = async (cardId: string) => {
    setBusy(true);
    try {
      await aiApi.deleteDeckCard(cardId);
      setDeck((d) => d.filter((c) => c._id !== cardId));
      setDue((d) => d.filter((c) => c._id !== cardId));
      toast.success('Card removed');
    } catch {
      /* toasted */
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading your deck…
      </div>
    );
  }

  return (
    <div data-testid="my-flashcards" className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <Layers className="w-6 h-6 text-primary" /> My Flashcards
        </h1>
        <button
          data-testid="start-review-btn"
          onClick={() => {
            setReviewing(true);
            setRevealed(false);
            setReviewedCount(0);
          }}
          disabled={due.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white
            hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <GraduationCap className="w-4 h-4" />
          Review {due.length > 0 ? `(${due.length} due)` : '(nothing due)'}
        </button>
      </div>

      {/* Review mode */}
      {reviewing && (
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          {currentCard ? (
            <AnimatePresence mode="popLayout">
              <motion.div
                key={currentCard._id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                className="text-center space-y-5"
              >
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  {due.length} left · {reviewedCount} done
                </p>
                <p data-testid="review-question" className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentCard.question}
                </p>
                {revealed ? (
                  <>
                    <p data-testid="review-answer" className="text-gray-600 dark:text-gray-300">
                      {currentCard.answer}
                    </p>
                    <div className="flex justify-center gap-2 flex-wrap">
                      {GRADES.map((g) => (
                        <button
                          key={g.label}
                          data-testid={`grade-${g.label.toLowerCase()}`}
                          onClick={() => grade(g.quality)}
                          disabled={busy}
                          className={`px-4 py-2 rounded-md border text-sm font-medium disabled:opacity-50 ${g.classes}`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <button
                    data-testid="reveal-btn"
                    onClick={() => setRevealed(true)}
                    className="px-5 py-2 rounded-md bg-primary text-white hover:bg-primary/90"
                  >
                    Show answer
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center space-y-3 py-6">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                🎉 All caught up!
              </p>
              <p className="text-sm text-gray-500">
                You reviewed {reviewedCount} card{reviewedCount === 1 ? '' : 's'}. Cards you found hard will come back sooner.
              </p>
              <button
                onClick={() => setReviewing(false)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-md border border-gray-300 dark:border-slate-600 text-sm"
              >
                <RotateCcw className="w-4 h-4" /> Back to deck
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create a standalone card */}
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-2">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Create a card</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            data-testid="deck-question-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Question"
            className="flex-1 text-sm px-3 py-2 rounded-md border border-gray-200 dark:border-slate-700
              bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            data-testid="deck-answer-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCard()}
            placeholder="Answer"
            className="flex-1 text-sm px-3 py-2 rounded-md border border-gray-200 dark:border-slate-700
              bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            data-testid="deck-add-btn"
            onClick={addCard}
            disabled={busy || !question.trim() || !answer.trim()}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-md bg-primary text-white disabled:opacity-60"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Whole deck */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Deck ({deck.length})
        </h2>
        {deck.length === 0 ? (
          <p className="text-sm text-gray-400">
            Your deck is empty — create cards above, or add them from any note's flashcards, AI generations, or missed quiz questions.
          </p>
        ) : (
          <ul className="space-y-2">
            {deck.map((card) => (
              <li
                key={card._id}
                className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{card.question}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.answer}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    due {new Date(card.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removeCard(card._id)}
                  disabled={busy}
                  className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 shrink-0"
                  aria-label="Delete card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MyFlashcards;
