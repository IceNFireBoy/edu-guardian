import React, { useState } from 'react';
import { PencilLine, Plus, Trash2, Check, X, ClipboardPaste, BookOpen, Loader2 } from 'lucide-react';
import { noteCardsApi, aiApi, NoteFlashcard } from '../../../api/ai';
import { useToast } from '../../../hooks/useToast';
import { NoteFlashcards } from './NoteFlashcards';

interface FlashcardEditorProps {
  noteId: string;
  /** The note's saved flashcards (owner-editable, viewer-readable) */
  cards: NoteFlashcard[];
  onCardsChange: (cards: NoteFlashcard[]) => void;
  /** Owners get the editing UI; everyone gets the deck + share button */
  isOwner: boolean;
}

/**
 * User-authored flashcards on a note. Owners can create, edit, delete and
 * bulk-import cards ("question | answer" per pasted line). Every viewer can
 * flip through the cards and add the whole set to their own review deck.
 */
const FlashcardEditor: React.FC<FlashcardEditorProps> = ({ noteId, cards, onCardsChange, isOwner }) => {
  const toast = useToast();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<NoteFlashcard[]>, successMsg: string) => {
    setBusy(true);
    try {
      const updated = await fn();
      onCardsChange(updated);
      toast.success(successMsg);
      return true;
    } catch {
      return false; // API layer already toasted
    } finally {
      setBusy(false);
    }
  };

  const addCard = async () => {
    if (!question.trim() || !answer.trim()) return;
    const ok = await run(
      () => noteCardsApi.create(noteId, { question: question.trim(), answer: answer.trim() }),
      'Flashcard added'
    );
    if (ok) {
      setQuestion('');
      setAnswer('');
    }
  };

  const saveEdit = async (cardId: string) => {
    const ok = await run(
      () => noteCardsApi.update(noteId, cardId, { question: editQ.trim(), answer: editA.trim() }),
      'Flashcard updated'
    );
    if (ok) setEditingId(null);
  };

  const deleteCard = (cardId: string) =>
    run(() => noteCardsApi.remove(noteId, cardId), 'Flashcard deleted');

  const importCards = async () => {
    // One card per line: "question | answer" (also accepts "question :: answer")
    const parsed = importText
      .split('\n')
      .map((line) => {
        const parts = line.split(/\s*(?:\||::)\s*/);
        return parts.length >= 2 && parts[0].trim() && parts[1].trim()
          ? { question: parts[0].trim(), answer: parts.slice(1).join(' ').trim() }
          : null;
      })
      .filter((c): c is { question: string; answer: string } => c !== null);

    if (parsed.length === 0) {
      toast.error('No valid lines found. Use one "question | answer" per line.');
      return;
    }
    const ok = await run(
      () => noteCardsApi.bulkAdd(noteId, parsed),
      `Imported ${parsed.length} flashcards`
    );
    if (ok) {
      setImportText('');
      setShowImport(false);
    }
  };

  const addAllToDeck = async () => {
    if (cards.length === 0) return;
    setBusy(true);
    try {
      const { added } = await aiApi.addToReviewDeck(
        cards.map((c) => ({ question: c.question, answer: c.answer })),
        noteId
      );
      toast.success(`Added ${added} cards to your review deck`);
    } catch {
      /* toasted by API layer */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="flashcard-editor" className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <PencilLine className="w-4 h-4 text-primary" /> Note Flashcards
          <span className="text-xs font-normal text-gray-400">({cards.length})</span>
        </h3>
        <div className="flex items-center gap-2">
          {cards.length > 0 && (
            <button
              data-testid="editor-add-deck-btn"
              onClick={addAllToDeck}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-primary
                text-primary hover:bg-primary/10 disabled:opacity-60 transition-colors"
            >
              <BookOpen className="w-4 h-4" /> Add to my review deck
            </button>
          )}
          {isOwner && (
            <button
              data-testid="editor-import-toggle"
              onClick={() => setShowImport((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-300
                dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ClipboardPaste className="w-4 h-4" /> Import
            </button>
          )}
        </div>
      </div>

      {isOwner && showImport && (
        <div className="space-y-2 rounded-lg border border-dashed border-gray-300 dark:border-slate-600 p-3">
          <p className="text-xs text-gray-500">
            Paste one card per line as <code>question | answer</code>
          </p>
          <textarea
            data-testid="editor-import-textarea"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={4}
            placeholder={'What is a cell? | The basic unit of life\nWhat is DNA? | The molecule carrying genetic instructions'}
            className="w-full text-sm px-3 py-2 rounded-md border border-gray-200 dark:border-slate-700
              bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            data-testid="editor-import-btn"
            onClick={importCards}
            disabled={busy || !importText.trim()}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Import cards'}
          </button>
        </div>
      )}

      {isOwner && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            data-testid="editor-question-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Question"
            className="flex-1 text-sm px-3 py-2 rounded-md border border-gray-200 dark:border-slate-700
              bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            data-testid="editor-answer-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCard()}
            placeholder="Answer"
            className="flex-1 text-sm px-3 py-2 rounded-md border border-gray-200 dark:border-slate-700
              bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            data-testid="editor-add-btn"
            onClick={addCard}
            disabled={busy || !question.trim() || !answer.trim()}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-md bg-primary text-white
              disabled:opacity-60 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      )}

      {cards.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {isOwner
            ? 'No flashcards yet — add your own above, import a batch, or generate some with AI.'
            : 'This note has no flashcards yet.'}
        </p>
      ) : isOwner ? (
        // Owner list view with inline edit/delete
        <ul className="space-y-2">
          {cards.map((card) => (
            <li
              key={card._id}
              data-testid={`editor-card-${card._id}`}
              className="rounded-lg border border-gray-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800"
            >
              {editingId === card._id ? (
                <div className="space-y-2">
                  <input
                    value={editQ}
                    onChange={(e) => setEditQ(e.target.value)}
                    className="w-full text-sm px-2 py-1.5 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  />
                  <input
                    value={editA}
                    onChange={(e) => setEditA(e.target.value)}
                    className="w-full text-sm px-2 py-1.5 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(card._id)}
                      disabled={busy || !editQ.trim() || !editA.trim()}
                      className="p-1.5 rounded bg-green-500/10 text-green-600 disabled:opacity-50"
                      aria-label="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500"
                      aria-label="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{card.question}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{card.answer}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingId(card._id);
                        setEditQ(card.question);
                        setEditA(card.answer);
                      }}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400"
                      aria-label="Edit flashcard"
                    >
                      <PencilLine className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCard(card._id)}
                      disabled={busy}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400"
                      aria-label="Delete flashcard"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        // Viewer: shared flip-deck
        <NoteFlashcards cards={cards} title="" />
      )}
    </div>
  );
};

export default FlashcardEditor;
