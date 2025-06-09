import React, { useState, useRef, useEffect } from 'react';
import { Note } from '../../types/note';
import AISummarizer from './AISummarizer';
import FlashcardGenerator from './FlashcardGenerator';
import { toast } from 'react-hot-toast';
import { FaRobot, FaLightbulb, FaSpinner, FaBook, FaPlus } from 'react-icons/fa';
import { useNote } from '../useNote'; // Import the useNote hook

interface AIFeaturesPanelProps {
  note: Note;
  showManualFlashcard?: boolean;
  className?: string;
}

const AIFeaturesPanel: React.FC<AIFeaturesPanelProps> = ({ note, showManualFlashcard = false, className = '' }) => {
  const [showSummarizerModal, setShowSummarizerModal] = useState(false);
  const [showFlashcardGeneratorModal, setShowFlashcardGeneratorModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitTimeoutRef = useRef<NodeJS.Timeout>();

  // Manual flashcard creation state
  const [manualFlashcardData, setManualFlashcardData] = useState<ManualFlashcardPayload>({ question: '', answer: '' });
  const [showManualFlashcardForm, setShowManualFlashcardForm] = useState<boolean>(false);

  const { addManualFlashcard, loading: noteHookLoading, error: noteHookError } = useNote();

  const handleManualFlashcardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    if (!manualFlashcardData.question || !manualFlashcardData.answer) {
      toast.error('Question and Answer cannot be empty for manual flashcards.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const createdFlashcard = await addManualFlashcard(note._id, manualFlashcardData);

      if (createdFlashcard) {
        toast.success('Manual flashcard added!');
        setManualFlashcardData({ question: '', answer: '' });
        setShowManualFlashcardForm(false);
      } else {
        toast.error(noteHookError || 'Failed to add manual flashcard.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add manual flashcard.');
    } finally {
      // Add a small delay before allowing another submission
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
      submitTimeoutRef.current = setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`ai-features-panel ${className}`}>
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setShowSummarizerModal(true)}
          disabled={isSubmitting || noteHookLoading}
          className="btn btn-primary flex items-center gap-2"
        >
          <FaLightbulb className="text-yellow-400" />
          Generate Summary
        </button>

        <button
          onClick={() => setShowFlashcardGeneratorModal(true)}
          disabled={isSubmitting || noteHookLoading}
          className="btn btn-secondary flex items-center gap-2"
        >
          <FaBook className="text-blue-400" />
          Generate Flashcards
        </button>

        {showManualFlashcard && (
          <button
            onClick={() => setShowManualFlashcardForm(true)}
            disabled={isSubmitting || noteHookLoading}
            className="btn btn-outline flex items-center gap-2"
          >
            <FaPlus className="text-green-400" />
            Add Manual Flashcard
          </button>
        )}
      </div>

      {showManualFlashcardForm && (
        <form onSubmit={handleManualFlashcardSubmit} className="mt-4 p-4 border rounded-lg">
          <div className="space-y-4">
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Question
              </label>
              <input
                type="text"
                id="question"
                value={manualFlashcardData.question}
                onChange={(e) => setManualFlashcardData(prev => ({ ...prev, question: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="answer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Answer
              </label>
              <textarea
                id="answer"
                value={manualFlashcardData.answer}
                onChange={(e) => setManualFlashcardData(prev => ({ ...prev, answer: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowManualFlashcardForm(false)}
                disabled={isSubmitting}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !manualFlashcardData.question || !manualFlashcardData.answer}
                className="btn btn-primary"
              >
                {isSubmitting ? 'Adding...' : 'Add Flashcard'}
              </button>
            </div>
          </div>
        </form>
      )}

      {note && (
        <>
          <AISummarizer 
            isOpen={showSummarizerModal} 
            onClose={() => setShowSummarizerModal(false)} 
            noteId={note._id} 
            noteTitle={note.title} 
          />
          <FlashcardGenerator 
            isOpen={showFlashcardGeneratorModal} 
            onClose={() => setShowFlashcardGeneratorModal(false)} 
            noteId={note._id} 
            noteTitle={note.title} 
          />
        </>
      )}
    </div>
  );
};

export default AIFeaturesPanel;
