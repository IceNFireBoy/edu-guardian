import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaRegStar, FaDownload, FaEye, FaEdit, FaTrash, FaShare, FaRobot } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNote } from '../hooks/useNote';
import { useAuth } from '../hooks/useAuth';
import { Note } from '../../types/note';
import { getRelativeTime, formatDate } from '../../utils/dateUtils';
import AIFeaturesPanel from './components/AIFeaturesPanel';

interface NoteDetailsProps {
  note: Note;
  onEdit?: () => void;
  onDelete?: () => void;
  loading?: boolean;
  error?: string | null;
}

const NoteDetails: React.FC<NoteDetailsProps> = ({ 
  note, 
  onEdit, 
  onDelete,
  loading = false,
  error = null
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentRating, setCurrentRating] = useState<number>(0);
  const [isRating, setIsRating] = useState(false);
  const { rateNote, downloadNote } = useNote();

  useEffect(() => {
    if (note.ratings && note.ratings.length > 0 && user?._id) {
      const userRating = note.ratings.find(r => r.userId === user._id);
      if (userRating) {
        setCurrentRating(userRating.value);
      }
    }
  }, [note.ratings, user?._id]);

  const handleRatingChange = async (rating: number) => {
    if (!user) {
      toast.error('Please log in to rate notes');
      return;
    }

    setIsRating(true);
    try {
      const response = await rateNote(note._id, rating);
      if (response?.success) {
        setCurrentRating(rating);
        toast.success('Rating submitted successfully');
      } else {
        toast.error(response?.error || 'Failed to submit rating');
      }
    } catch (error) {
      toast.error('An error occurred while submitting your rating');
    } finally {
      setIsRating(false);
    }
  };

  const handleDownload = async () => {
    if (!note.fileUrl) {
      toast.error('No file available for download');
      return;
    }

    try {
      const response = await downloadNote(note._id);
      if (response?.success) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = response.downloadUrl;
        link.download = note.title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download started');
      } else {
        toast.error(response?.error || 'Failed to download note');
      }
    } catch (error) {
      toast.error('An error occurred while downloading the note');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: note.title,
        text: `Check out this note: ${note.title}`,
        url: window.location.href
      }).catch(() => {
        toast.error('Failed to share note');
      });
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('Link copied to clipboard'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };

  if (loading && !note) return <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading note details...</div>;
  if (error && !note) return <div className="text-red-500 text-center py-10">Error loading note: {error}</div>;
  if (!note) return <div className="text-center py-10 text-gray-500 dark:text-gray-400">Note not found or still loading.</div>;

  const hasSummary = note.aiSummary && note.aiSummary.trim() !== '';
  const hasKeyPoints = note.aiSummaryKeyPoints && note.aiSummaryKeyPoints.length > 0;
  const hasFlashcards = note.flashcards && note.flashcards.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {note.title}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
            <span className="flex items-center">
              <FaEye className="mr-1" /> {note.viewCount} views
            </span>
            <span className="flex items-center">
              <FaDownload className="mr-1" /> {note.downloadCount} downloads
            </span>
            <span>Last updated: {formatDate(note.updatedAt)}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          {user && (user._id === note.user || user.role === 'admin') && (
            <>
              <button
                onClick={onEdit}
                className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                title="Edit note"
              >
                <FaEdit />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                title="Delete note"
              >
                <FaTrash />
              </button>
            </>
          )}
          <button
            onClick={handleShare}
            className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
            title="Share note"
          >
            <FaShare />
          </button>
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none mb-6">
        <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
          <p className="whitespace-pre-wrap">{note.content}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Subject</h3>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{note.subject}</p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Grade</h3>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{note.grade}</p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Semester</h3>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{note.semester}</p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Quarter</h3>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{note.quarter}</p>
        </div>
      </div>

      {note.topic && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Topic</h3>
          <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
            <p className="text-gray-900 dark:text-white">{note.topic}</p>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rating</h3>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white mr-2">
              {note.averageRating.toFixed(1)}
            </span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingChange(star)}
                  disabled={isRating}
                  className={`text-2xl ${
                    star <= currentRating
                      ? 'text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  } hover:text-yellow-400 transition-colors`}
                >
                  {star <= currentRating ? <FaStar /> : <FaRegStar />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {note.fileUrl && (
          <button
            onClick={handleDownload}
            className="w-full btn btn-primary flex items-center justify-center"
          >
            <FaDownload className="mr-2" /> Download Note
          </button>
        )}
      </div>

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
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Points</h4>
            <ul className="list-disc list-inside space-y-1">
              {note.aiSummaryKeyPoints.map((point, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                <FaRobot className="mr-2 text-yellow-500 dark:text-yellow-400" /> AI Flashcards
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
      </div>

      <AIFeaturesPanel 
        note={note} 
        showManualFlashcard={false}
      />
    </motion.div>
  );
};

export default NoteDetails; 