import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Plus, Trash2, Loader2, GraduationCap, RotateCcw, Search,
  ClipboardPaste, Upload, Flame, CheckCircle2, Clock,
} from 'lucide-react';
import { aiApi, DueCard } from '../api/ai';
import { useToast } from '../hooks/useToast';
import { parseFlashcards } from '../utils/parseFlashcards';

/**
 * The user's personal spaced-repetition deck.
 * - Stat tiles: due now / total / mastered.
 * - Review mode: one big 3D flip card at a time; Space reveals, keys 1-4 grade
 *   (Again/Hard/Good/Easy → SM-2 quality 1/3/4/5).
 * - Create single cards, or import a whole deck: paste OR upload .txt/.csv/
 *   .tsv/.md — supports Anki "Notes in Plain Text" exports and the CSV/Q&A
 *   formats AI chatbots produce.
 */

interface DeckCard extends DueCard {
  interval?: number;
}

const GRADES: Array<{ label: string; key: string; quality: number; classes: string }> = [
  { label: 'Again', key: '1', quality: 1, classes: 'bg-red-500/10 text-red-600 border-red-300 dark:border-red-700' },
  { label: 'Hard', key: '2', quality: 3, classes: 'bg-yellow-500/10 text-yellow-600 border-yellow-300 dark:border-yellow-700' },
  { label: 'Good', key: '3', quality: 4, classes: 'bg-green-500/10 text-green-600 border-green-300 dark:border-green-700' },
  { label: 'Easy', key: '4', quality: 5, classes: 'bg-blue-500/10 text-blue-600 border-blue-300 dark:border-blue-700' },
];

const StatTile: React.FC<{ icon: React.ReactNode; label: string; value: number | string }> = ({ icon, label, value }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
  >
    <div className="p-2.5 rounded-lg bg-primary/10 text-primary">{icon}</div>
    <div>
      <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  </motion.div>
);

const MyFlashcards: React.FC = () => {
  const toast = useToast();
  const [deck, setDeck] = useState<DeckCard[]>([]);
  const [due, setDue] = useState<DueCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
  const mastered = useMemo(
    () => deck.filter((c) => (c.interval ?? 0) >= 21).length,
    [deck]
  );
  const filteredDeck = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return deck;
    return deck.filter(
      (c) => c.question.toLowerCase().includes(q) || c.answer.toLowerCase().includes(q)
    );
  }, [deck, search]);

  const grade = useCallback(
    async (quality: number) => {
      if (!currentCard || busy) return;
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
    },
    [currentCard, busy]
  );

  // Keyboard-first review: Space reveals, 1-4 grade.
  useEffect(() => {
    if (!reviewing || !currentCard) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed) {
        const g = GRADES.find((gr) => gr.key === e.key);
        if (g) grade(g.quality);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reviewing, revealed, currentCard, grade]);

  const startReview = () => {
    setReviewing(true);
    setRevealed(false);
    setReviewedCount(0);
    setReviewTotal(due.length);
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

  const importFromText = async (text: string) => {
    const parsed = parseFlashcards(text);
    if (parsed.length === 0) {
      toast.error('No cards found. Supported: Anki .txt export, CSV, "question | answer", Q:/A: pairs.');
      return;
    }
    setBusy(true);
    try {
      const { added } = await aiApi.addToReviewDeck(parsed);
      toast.success(`Imported ${added} cards into your deck 🎉`);
      setImportText('');
      setShowImport(false);
      await load();
    } catch {
      /* toasted */
    } finally {
      setBusy(false);
    }
  };

  const onFilePicked = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    await importFromText(text);
    if (fileRef.current) fileRef.current.value = '';
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
          onClick={startReview}
          disabled={due.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white
            hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <GraduationCap className="w-4 h-4" />
          Review {due.length > 0 ? `(${due.length} due)` : '(nothing due)'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={<Clock className="w-5 h-5" />} label="Due now" value={due.length} />
        <StatTile icon={<Layers className="w-5 h-5" />} label="Total cards" value={deck.length} />
        <StatTile icon={<CheckCircle2 className="w-5 h-5" />} label="Mastered" value={mastered} />
      </div>

      {/* ---- Review mode ---- */}
      <AnimatePresence>
        {reviewing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
              {currentCard ? (
                <div className="space-y-4">
                  {/* Progress */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        animate={{ width: `${(reviewedCount / Math.max(reviewTotal, 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {reviewedCount}/{reviewTotal}
                    </span>
                  </div>

                  {/* Big 3D flip card */}
                  <div
                    className="mx-auto max-w-md h-56 cursor-pointer select-none"
                    style={{ perspective: 1200 }}
                    onClick={() => setRevealed(true)}
                  >
                    <motion.div
                      className="relative w-full h-full"
                      style={{ transformStyle: 'preserve-3d' }}
                      animate={{ rotateY: revealed ? 180 : 0 }}
                      transition={{ duration: 0.5, ease: [0.4, 0.2, 0.2, 1] }}
                    >
                      <div
                        className="absolute inset-0 rounded-2xl border-2 border-primary/30 bg-white dark:bg-slate-900 p-6 flex flex-col items-center justify-center text-center"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <p data-testid="review-question" className="text-lg font-semibold text-gray-900 dark:text-white overflow-y-auto">
                          {currentCard.question}
                        </p>
                        <span className="mt-3 text-[11px] text-gray-400">click or press Space to reveal</span>
                      </div>
                      <div
                        className="absolute inset-0 rounded-2xl border-2 border-primary bg-primary/5 dark:bg-slate-900 p-6 flex items-center justify-center text-center"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      >
                        <p data-testid="review-answer" className="text-base text-gray-800 dark:text-gray-100 overflow-y-auto">
                          {currentCard.answer}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {revealed && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center gap-2 flex-wrap"
                    >
                      {GRADES.map((g) => (
                        <button
                          key={g.label}
                          data-testid={`grade-${g.label.toLowerCase()}`}
                          onClick={() => grade(g.quality)}
                          disabled={busy}
                          className={`px-4 py-2 rounded-md border text-sm font-medium disabled:opacity-50 ${g.classes}`}
                        >
                          {g.label} <span className="opacity-50 text-xs">({g.key})</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="text-center space-y-3 py-6">
                  <motion.p
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-2xl font-bold text-gray-900 dark:text-white"
                  >
                    🎉 All caught up!
                  </motion.p>
                  <p className="text-sm text-gray-500">
                    {reviewedCount} card{reviewedCount === 1 ? '' : 's'} reviewed. Hard ones will come back sooner — that's the system working.
                  </p>
                  <div className="flex items-center justify-center gap-1 text-orange-500 text-sm">
                    <Flame className="w-4 h-4" /> Streak fuel earned
                  </div>
                  <button
                    onClick={() => setReviewing(false)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-md border border-gray-300 dark:border-slate-600 text-sm"
                  >
                    <RotateCcw className="w-4 h-4" /> Back to deck
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Create + import ---- */}
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Add cards</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImport((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300"
            >
              <ClipboardPaste className="w-3.5 h-3.5" /> Paste import
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300"
            >
              <Upload className="w-3.5 h-3.5" /> Import file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.csv,.tsv,.md,text/plain,text/csv"
              className="hidden"
              onChange={(e) => onFilePicked(e.target.files?.[0])}
              data-testid="deck-file-input"
            />
          </div>
        </div>

        {showImport && (
          <div className="space-y-2 rounded-lg border border-dashed border-gray-300 dark:border-slate-600 p-3">
            <p className="text-xs text-gray-500">
              Paste cards in any of these formats: Anki export (File → Export → "Notes in Plain Text"),
              CSV from ChatGPT/Claude/Gemini ("Front,Back"), <code>question | answer</code> lines, or Q:/A: pairs.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={4}
              placeholder={'What is a cell?\tThe basic unit of life\nQ: What is DNA?\nA: The molecule of heredity'}
              className="w-full text-sm px-3 py-2 rounded-md border border-gray-200 dark:border-slate-700
                bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={() => importFromText(importText)}
              disabled={busy || !importText.trim()}
              className="px-3 py-1.5 text-sm rounded-md bg-primary text-white disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Import'}
            </button>
          </div>
        )}

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

      {/* ---- Deck list ---- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Deck ({deck.length})</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards…"
              className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-slate-700
                bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {filteredDeck.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            {deck.length === 0
              ? 'Your deck is empty — create cards above, import a deck, or add them from any note.'
              : 'No cards match your search.'}
          </p>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {filteredDeck.map((card) => (
                <motion.li
                  key={card._id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{card.question}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{card.answer}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      due {new Date(card.dueDate).toLocaleDateString()}
                      {(card.interval ?? 0) >= 21 && (
                        <span className="ml-2 text-green-500">mastered</span>
                      )}
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
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
};

export default MyFlashcards;
