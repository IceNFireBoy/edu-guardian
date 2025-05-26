import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaShare, FaStar, FaRobot, FaLightbulb, FaDownload, FaTrash, FaSpinner } from 'react-icons/fa';
import { Note } from '../../../types/note';
import { useNote } from '../useNote'; // For rateNote and deleteNote
import { subjectColors, getSubjectColor } from '../NoteCard'; // Assuming NoteCard.tsx is in the same directory
import AISummarizer from './AISummarizer';
import FlashcardGenerator from './FlashcardGenerator';
import { toast } from 'react-hot-toast';

interface NoteDetailModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onNoteUpdate: (updatedNote: Note) => void; // Callback when note is rated or otherwise updated client-side
  onNoteDelete: (noteId: string) => void; // Callback when note is deleted
}

// Helper to get average rating from localStorage (if still needed, or use note.rating)
const getLocalRating = (noteId: string): number | null => {
  try {
    const ratingsData = localStorage.getItem('note_ratings') || '{}';
    const ratings = JSON.parse(ratingsData);
    return ratings[noteId] || null;
  } catch (e) {
    return null;
  }
};

const NoteDetailModal: React.FC<NoteDetailModalProps> = ({ note, isOpen, onClose, onNoteUpdate, onNoteDelete }) => {
  const [showSummarizer, setShowSummarizer] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [currentRating, setCurrentRating] = useState<number>(0);
  const { rateNote, deleteNote: deleteNoteHook, loading: noteActionLoading, error: noteActionError } = useNote();

  React.useEffect(() => {
    if (note) {
      // Use the first rating value if available, else fallback
      const firstRating = note.ratings?.[0]?.value;
      const localRating = getLocalRating(note._id);
      setCurrentRating(firstRating || localRating || 0);
    }
    if (noteActionError) {
      toast.error(noteActionError);
    }
  }, [note, noteActionError]);

  if (!isOpen || !note) return null;

  const colorTheme = note.subject ? getSubjectColor(note.subject) : subjectColors.default;

  const handleRatingSubmit = async (newRating: number) => {
    if (!note) return;
    const ratingResult = await rateNote(note._id, newRating);
    if (ratingResult) {
      setCurrentRating(newRating);
      const updatedRatings: NoteRating[] = [
        ...(note.ratings || []),
        {
          _id: `temp-${Date.now()}`,
          noteId: note._id,
          userId: 'current-user',
          value: newRating,
          createdAt: new Date().toISOString()
        }
      ];
      const updatedNote: Note = { ...note, ratings: updatedRatings };
      onNoteUpdate(updatedNote);
      toast.success('Rating submitted!');
      try {
        const ratingsData = localStorage.getItem('note_ratings') || '{}';
        const ratings = JSON.parse(ratingsData);
        ratings[note._id] = newRating;
        localStorage.setItem('note_ratings', JSON.stringify(ratings));
      } catch (e) {
        console.error('Error saving rating to localStorage', e);
      }
    }
  };

  const getShareableLink = (): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/view-note?id=${note._id}`; // Assuming a route like this exists
  };

  const handleShare = () => {
    const shareLink = getShareableLink();
    navigator.clipboard.writeText(shareLink)
      .then(() => toast.success('Link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link.'));
  };

  const handleDownload = () => {
    if(note.fileUrl) {
        window.open(note.fileUrl, '_blank');
        // Potentially call an API endpoint to increment download count here
        // recordActivity('DOWNLOAD_NOTE'); // If using useStreak or similar
        toast.success('Download started...');
    } else {
        toast.error('No file available for download.');
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
        const success = await deleteNoteHook(note._id);
        if (success) {
            toast.success('Note deleted successfully.');
            onNoteDelete(note._id);
            onClose();
        } else {
            // Error is handled by noteActionError effect
        }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-40"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center ${colorTheme.light} ${colorTheme.dark}`}>
              <h2 className={`text-xl font-semibold ${colorTheme.text} ${colorTheme.darkText}`}>{note.title}</h2>
              <button onClick={onClose} className={`p-1 rounded-full hover:bg-opacity-20 ${colorTheme.text} hover:bg-current`} aria-label="Close">
                <FaTimes size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{note.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div><strong className="text-gray-600 dark:text-gray-300">Subject:</strong> <span className="text-gray-800 dark:text-gray-100">{note.subject}</span></div>
                <div><strong className="text-gray-600 dark:text-gray-300">Grade:</strong> <span className="text-gray-800 dark:text-gray-100">{note.grade}</span></div>
                <div><strong className="text-gray-600 dark:text-gray-300">Semester:</strong> <span className="text-gray-800 dark:text-gray-100">{note.semester}</span></div>
                <div><strong className="text-gray-600 dark:text-gray-300">Quarter:</strong> <span className="text-gray-800 dark:text-gray-100">{note.quarter}</span></div>
                <div className="sm:col-span-2"><strong className="text-gray-600 dark:text-gray-300">Topic:</strong> <span className="text-gray-800 dark:text-gray-100">{note.topic}</span></div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong className="text-gray-600 dark:text-gray-300">Views:</strong>{' '}
                  <span className="text-gray-800 dark:text-gray-100">{note.viewCount || 0}</span>
                </div>
                <div>
                  <strong className="text-gray-600 dark:text-gray-300">Rating:</strong>{' '}
                  <span className="text-gray-800 dark:text-gray-100">
                    {note.ratings?.length
                      ? (note.ratings.reduce((sum, r) => sum + r.value, 0) / note.ratings.length).toFixed(1)
                      : '0.0'} ({note.ratings?.length || 0} votes)
                  </span>
                </div>
                <div>
                  <strong className="text-gray-600 dark:text-gray-300">Flashcards:</strong>{' '}
                  <span className="text-gray-800 dark:text-gray-100">{note.flashcards?.length || 0}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Rate this Note</h3>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      onClick={() => handleRatingSubmit(star)} 
                      disabled={noteActionLoading}
                      className={`text-2xl focus:outline-none ${star <= currentRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'}`}
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <FaStar />
                    </button>
                  ))}
                  {noteActionLoading && <FaSpinner className="animate-spin ml-2 text-gray-500"/>}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-slate-700 pt-6 space-y-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Actions & Tools</h3>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setShowSummarizer(true)} className="btn btn-secondary btn-sm flex items-center">
                    <FaRobot className="mr-2" /> AI Summary
                  </button>
                  <button onClick={() => setShowFlashcards(true)} className="btn btn-secondary btn-sm flex items-center">
                    <FaLightbulb className="mr-2" /> Generate Flashcards
                  </button>
                  <button onClick={handleShare} className="btn btn-secondary btn-sm flex items-center">
                    <FaShare className="mr-2" /> Share Link
                  </button>
                  {note.fileUrl && (
                    <button onClick={handleDownload} className="btn btn-secondary btn-sm flex items-center">
                        <FaDownload className="mr-2" /> Download File
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer with Delete Button */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-end">
                <button 
                    onClick={handleDelete}
                    disabled={noteActionLoading}
                    className="btn btn-danger btn-sm flex items-center"
                >
                    <FaTrash className="mr-2"/> Delete Note
                </button>
            </div>

            {/* Modals for AI Tools */}
            {note && (
              <>
                <AISummarizer 
                  isOpen={showSummarizer} 
                  onClose={() => setShowSummarizer(false)} 
                  noteId={note._id} 
                  noteTitle={note.title} 
                />
                <FlashcardGenerator 
                  isOpen={showFlashcards} 
                  onClose={() => setShowFlashcards(false)} 
                  noteId={note._id} 
                  noteTitle={note.title} 
                />
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NoteDetailModal; 