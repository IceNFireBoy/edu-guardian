import React, { useState, useEffect } from 'react';
import { Note } from './noteTypes';
import { useNote } from './useNote';
import AIFeaturesPanel from './components/AIFeaturesPanel';
import { toast } from 'react-hot-toast';
import { FaRobot, FaLightbulb } from 'react-icons/fa';

interface NoteDetailsProps {
  noteId: string;
  onClose: () => void;
}

const NoteDetails: React.FC<NoteDetailsProps> = ({ noteId, onClose }) => {
  const { fetchNote, rateNote, loading, error } = useNote();
  const [note, setNote] = useState<Note | null>(null);
  const [currentRating, setCurrentRating] = useState<number>(0);

  useEffect(() => {
    const loadNote = async () => {
      const fetchedNote = await fetchNote(noteId);
      if (fetchedNote) {
        setNote(fetchedNote);
        setCurrentRating(fetchedNote.rating || 0); 
      } else if (error && !fetchedNote){
        setNote(null);
      }
    };
    if (noteId) {
      loadNote();
    }
  }, [noteId, fetchNote]);

  useEffect(() => {
    if(error) {
        toast.error(`Error: ${error}`);
    }
  }, [error]);

  const handleRatingSubmit = async (newRating: number) => {
    if (!note) return;
    
    const ratingResult = await rateNote(note.id, newRating);
    if (ratingResult) {
      const updatedNoteData = { ...note, rating: ratingResult.rating, ratingCount: (note.ratingCount || 0) + 1 }; 
      setNote(updatedNoteData);
      setCurrentRating(ratingResult.rating);
      toast.success('Rating submitted!');
    } 
  };

  if (loading && !note) return <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading note details...</div>;
  if (error && !note) return <div className="text-red-500 text-center py-10">Error loading note: {error}</div>;
  if (!note) return <div className="text-center py-10 text-gray-500 dark:text-gray-400">Note not found or still loading.</div>;

  const hasSummary = note.aiSummary && note.aiSummary.trim() !== '';
  const hasKeyPoints = note.aiSummaryKeyPoints && note.aiSummaryKeyPoints.length > 0;
  const hasFlashcards = note.flashcards && note.flashcards.length > 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{note.title}</h2>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-slate-600"
        >
          Close
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</h3>
        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{note.description || "No description provided."}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6 text-sm">
        <div><strong className="text-gray-600 dark:text-gray-300">Subject:</strong> <span className="text-gray-800 dark:text-gray-100">{note.subject}</span></div>
        <div><strong className="text-gray-600 dark:text-gray-300">Grade:</strong> <span className="text-gray-800 dark:text-gray-100">{note.grade}</span></div>
        <div><strong className="text-gray-600 dark:text-gray-300">Semester:</strong> <span className="text-gray-800 dark:text-gray-100">{note.semester}</span></div>
        <div><strong className="text-gray-600 dark:text-gray-300">Quarter:</strong> <span className="text-gray-800 dark:text-gray-100">{note.quarter}</span></div>
        <div className="col-span-2"><strong className="text-gray-600 dark:text-gray-300">Topic:</strong> <span className="text-gray-800 dark:text-gray-100">{note.topic}</span></div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6 text-sm">
        <div><strong className="text-gray-600 dark:text-gray-300">Views:</strong> <span className="text-gray-800 dark:text-gray-100">{note.viewCount || 0}</span></div>
        <div><strong className="text-gray-600 dark:text-gray-300">Rating:</strong> <span className="text-gray-800 dark:text-gray-100">{(note.averageRating || 0).toFixed(1)} ({note.ratings?.length || 0} votes)</span></div>
        <div><strong className="text-gray-600 dark:text-gray-300">Flashcards:</strong> <span className="text-gray-800 dark:text-gray-100">{note.flashcards?.length || 0}</span></div>
         <div><strong className="text-gray-600 dark:text-gray-300">Public:</strong> <span className="text-gray-800 dark:text-gray-100">{note.isPublic ? 'Yes' : 'No'}</span></div>
      </div>

      {/* AI Generated Summary Section */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                <FaRobot className="mr-2 text-primary dark:text-primary-light" /> AI Summary & Insights
            </h3>
            {(hasSummary || hasKeyPoints) && (
                 <span 
                    title="Content generated by AI"
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-700 dark:text-sky-200"
                    >
                    <FaRobot className="mr-1" /> AI Enhanced
                </span>
            )}
        </div>
        {hasSummary ? (
          <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-md mb-3">
            <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">
              {note.aiSummary}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-3">
            AI Summary not generated yet.
          </p>
        )}
        {hasKeyPoints && (
          <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-md mb-3">
            <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-1 text-sm">Key Points:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 text-sm">
              {note.aiSummaryKeyPoints!.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        )}
        {(hasSummary || hasKeyPoints) && note.aiSummaryGeneratedAt && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
            <i>Summary Generated: {new Date(note.aiSummaryGeneratedAt).toLocaleString()}</i>
          </p>
        )}
      </div>

      {/* AI Generated Flashcards Section - basic info, generation via AIFeaturesPanel */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                <FaLightbulb className="mr-2 text-yellow-500 dark:text-yellow-400" /> AI Flashcards
            </h3>
            {hasFlashcards && (
                 <span 
                    title="Content generated by AI"
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-700 dark:text-sky-200"
                    >
                    <FaRobot className="mr-1" /> AI Enhanced
                </span>
            )}
        </div>
        {hasFlashcards ? (
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
            This note has <strong className="font-medium">{note.flashcards!.length}</strong> AI-generated flashcards. You can study them or generate a new set using the AI tools.
          </p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-3">
            AI Flashcards not generated for this note yet.
          </p>
        )}
        {/* The AIFeaturesPanel will contain buttons to open AISummarizer and FlashcardGenerator modals */}
        {/* Pass initial data to AIFeaturesPanel if needed for regeneration logic or display in modals */}
      </div>

      <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Rate this Note</h3>
        <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                key={star}
                type="button"
                onClick={() => handleRatingSubmit(star)}
                disabled={loading}
                className={`text-2xl focus:outline-none ${star <= currentRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-500 hover:text-yellow-300'}`}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                ★
                </button>
            ))}
            {loading && <span className="ml-2 text-sm text-gray-500">Processing...</span>}
        </div>
      </div>

      <AIFeaturesPanel 
        note={note} 
        showManualFlashcard={false} // Assuming we only want AI flashcards from here for now
        // onAISummaryGenerated={(summaryData) => setNote(prev => prev ? {...prev, ...summaryData} : null)} // Example how to update note in place
        // onAIFlashcardsGenerated={(flashcardsData) => setNote(prev => prev ? {...prev, flashcards: flashcardsData} : null)} // Example
      />
    </div>
  );
};

export default NoteDetails; 