import React, { useState } from 'react';
import { Note, Flashcard as FlashcardType, ManualFlashcardPayload } from '../noteTypes'; // FlashcardType to avoid conflict
import AISummarizer from './AISummarizer';
import FlashcardGenerator from './FlashcardGenerator';
import { toast } from 'react-hot-toast';
import { FaRobot, FaLightbulb, FaSpinner } from 'react-icons/fa';
import { useNote } from '../useNote'; // Import the useNote hook

interface AIFeaturesPanelProps {
  note: {
    id: string;
    title: string;
    content: string;
    subject: string;
    grade: string;
    semester: string;
    quarter: string;
    topic: string;
    isPublic: boolean;
    fileUrl: string;
    createdAt: Date;
    user: string;
  };
  showManualFlashcard?: boolean;
  className?: string;
}

const AIFeaturesPanel: React.FC<AIFeaturesPanelProps> = ({ note, showManualFlashcard = false, className = '' }) => {
  const [showSummarizerModal, setShowSummarizerModal] = useState(false);
  const [showFlashcardGeneratorModal, setShowFlashcardGeneratorModal] = useState(false);

  // Manual flashcard creation state
  const [manualFlashcardData, setManualFlashcardData] = useState<ManualFlashcardPayload>({ question: '', answer: '' });
  const [showManualFlashcardForm, setShowManualFlashcardForm] = useState<boolean>(false);

  const { addManualFlashcard, loading: noteHookLoading, error: noteHookError } = useNote(); // Get function and states from hook

  const handleManualFlashcardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFlashcardData.question || !manualFlashcardData.answer) {
      toast.error('Question and Answer cannot be empty for manual flashcards.');
      return;
    }

    const createdFlashcard = await addManualFlashcard(note.id, manualFlashcardData);

    if (createdFlashcard) {
      toast.success('Manual flashcard added!');
      setManualFlashcardData({ question: '', answer: '' });
      setShowManualFlashcardForm(false);
      // Optionally, trigger a parent callback to refetch note data if flashcardCount needs update
      // Or, if useNote manages a local list of flashcards for the note, it could be updated there.
    } else {
      // Error toast will be handled by useNote or a global error handler for noteHookError
      // However, we can still show a specific toast here if needed, or rely on a global one.
      toast.error(noteHookError || 'Failed to add manual flashcard.');
    }
  };

  return (
    <div className={`ai-features-panel ${className}`}>
      {/* Manual Flashcard Maker Section (Optional) */}
      {showManualFlashcard && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800/50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Manual Flashcard</h3>
            <button
              onClick={() => setShowManualFlashcardForm(!showManualFlashcardForm)}
              className="btn btn-secondary btn-sm"
            >
              {showManualFlashcardForm ? 'Cancel' : 'Add New'}
            </button>
          </div>
          {showManualFlashcardForm && (
            <form onSubmit={handleManualFlashcardSubmit} className="space-y-3">
              <div>
                <label htmlFor={`manual-q-${note.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Question
                </label>
                <input
                  id={`manual-q-${note.id}`}
                  type="text"
                  value={manualFlashcardData.question}
                  onChange={(e) => setManualFlashcardData(prev => ({ ...prev, question: e.target.value }))}
                  required
                  className="w-full input input-bordered dark:bg-slate-700"
                />
              </div>
              <div>
                <label htmlFor={`manual-a-${note.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Answer
                </label>
                <textarea
                  id={`manual-a-${note.id}`}
                  value={manualFlashcardData.answer}
                  onChange={(e) => setManualFlashcardData(prev => ({ ...prev, answer: e.target.value }))}
                  required
                  rows={2}
                  className="w-full textarea textarea-bordered dark:bg-slate-700"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-sm w-full"
                disabled={noteHookLoading}
              >
                {noteHookLoading ? <FaSpinner className="animate-spin mr-2" /> : null}
                {noteHookLoading ? 'Adding...' : 'Add Flashcard'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* AI Summarizer Trigger */}
      <div className="mb-4">
        <button 
          onClick={() => setShowSummarizerModal(true)} 
          className="btn btn-outline btn-primary w-full flex items-center justify-center gap-2"
        >
          <FaRobot /> AI Summary
        </button>
      </div>

      {/* AI Flashcard Generator Trigger */}
      <div>
        <button 
          onClick={() => setShowFlashcardGeneratorModal(true)} 
          className="btn btn-outline btn-secondary w-full flex items-center justify-center gap-2"
        >
          <FaLightbulb /> AI Flashcards
        </button>
      </div>

      {/* Modals (Portal here if needed, but typically modals handle their own portal/fixed positioning) */}
      {note && (
        <>
          <AISummarizer 
            isOpen={showSummarizerModal} 
            onClose={() => setShowSummarizerModal(false)} 
            noteId={note.id} 
            noteTitle={note.title} 
          />
          <FlashcardGenerator 
            isOpen={showFlashcardGeneratorModal} 
            onClose={() => setShowFlashcardGeneratorModal(false)} 
            noteId={note.id} 
            noteTitle={note.title} 
          />
        </>
      )}
    </div>
  );
};

export default AIFeaturesPanel;
