import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaSpinner, FaTimes, FaCopy, FaCheck, FaBookmark, FaAward } from 'react-icons/fa';
import { useNote } from '../useNote';
import { AISummary as AISummaryType, NewlyAwardedBadgeInfo } from '../noteTypes';
import { useUser } from '../../user/useUser';
import AIQuotaDisplay from '../../user/components/AIQuotaDisplay';
import BadgeGrid from '../../user/components/BadgeGrid';
import { toast } from 'react-hot-toast';
import { callAuthenticatedApi } from '../../../api/apiClient';

interface AISummarizerProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string; 
  noteTitle?: string;
  initialSummary?: AISummaryType | null; // Allow passing an initial summary
}

const AISummarizer: React.FC<AISummarizerProps> = ({ isOpen, onClose, noteId, noteTitle, initialSummary }) => {
  const [summary, setSummary] = useState<AISummaryType | null>(initialSummary || null);
  const [copied, setCopied] = useState(false);
  const { getAISummary, loading, error } = useNote();
  const [internalError, setInternalError] = useState<string | null>(null);
  const { profile, fetchUserProfile, completeStudy, newXp, newBadgeIds: userNewBadgeIds } = useUser();
  const [studyComplete, setStudyComplete] = useState(false);
  const [completingStudy, setCompletingStudy] = useState(false);
  const [showBadges, setShowBadges] = useState(false);

  useEffect(() => {
    // Reset internal error when the main error from the hook changes or is cleared
    setInternalError(error);
  }, [error]);

  useEffect(() => {
    // If the modal is opened and there's no summary yet, and not already loading, fetch it.
    // For now, we rely on the button click, so this effect can be more for reset/cleanup.
    if (!isOpen) {
      // setSummary(null); // Keep summary if modal is just re-opened, unless it should always refetch or clear
      setInternalError(null); // Clear errors when modal closes
      setStudyComplete(false);
      setShowBadges(false);
    } else {
      // If opened with an initial summary, set it.
      if (initialSummary) {
        setSummary(initialSummary);
      }
    }
  }, [isOpen, initialSummary]);

  useEffect(() => {
    // Show newly earned badges if there are any
    if (userNewBadgeIds && userNewBadgeIds.length > 0) {
      setShowBadges(true);
    }
  }, [userNewBadgeIds]);

  const handleSummarize = async () => {
    if (!noteId) {
      setInternalError('Note ID is missing, cannot generate summary.');
      toast.error('Note ID is missing.');
      return;
    }
    setInternalError(null); 
    setSummary(null); // Clear previous summary
    
    const toastId = toast.loading('Generating AI Summary...');
    const response = await getAISummary(noteId);
    toast.dismiss(toastId);

    if (response && response.data) {
      const summaryResult = response.data;
      if (!summaryResult || (!summaryResult.summary && (!summaryResult.keyPoints || summaryResult.keyPoints.length === 0))) {
        setSummary({ 
            noteId: noteId, 
            summary: null,
            keyPoints: [],
            generatedAt: summaryResult?.generatedAt || new Date() 
        });
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <span className="text-xl">ℹ️</span>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Content Notice
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    AI couldn't generate a meaningful summary or key points for this note. The content might be too short or in an unsupported format.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Close
              </button>
            </div>
          </div>
        ), { duration: 6000 });
      } else {
        setSummary(summaryResult);
        toast.success('AI Summary generated successfully!');
      }
      
      if (response.newlyAwardedBadges && response.newlyAwardedBadges.length > 0) {
        fetchUserProfile(); // Refresh profile to update badge display on profile page
        response.newlyAwardedBadges.forEach((badge: NewlyAwardedBadgeInfo) => {
          toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-green-500 text-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <FaAward className="text-xl text-yellow-300" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-semibold">
                      New Badge Unlocked!
                    </p>
                    <p className="mt-1 text-sm">
                      You've earned the "{badge.name}" ({badge.level}) badge! (+{badge.xpReward} XP)
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-green-600">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Awesome!
                </button>
              </div>
            </div>
          ), { duration: 5000, icon: '🎉' });
        });
      }
    } else {
      // Error is handled by the useNote hook and will be in 'error' state
      // internalError is set via useEffect listening to hook's error
      // Show a generic toast error if internalError is set by the hook
      if (error) { // 'error' is from useNote()
        toast.error(error || 'Failed to generate summary. Please try again.');
      } else {
        toast.error('An unexpected issue occurred. Please try again.');
      }
    }
  };
  
  const copyToClipboard = () => {
    if (!summary || !summary.summary) return;
    
    const textToCopy = `
Summary of "${noteTitle || 'Note'}":

${summary.summary}

${summary.keyPoints && summary.keyPoints.length > 0 ? 'Key Points:\n' + summary.keyPoints.map(point => `• ${point}`).join('\n') : ''}
    `.trim();
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCompleteStudy = async () => {
    if (!noteId) return;
    
    setCompletingStudy(true);
    const success = await completeStudy({
      noteId,
      duration: 10, // Assume 10 minutes of study time when using summarizer
    });
    
    if (success) {
      setStudyComplete(true);
      toast.success('Study session recorded! XP awarded.');
    } else {
      toast.error('Unable to record study session.');
    }
    setCompletingStudy(false);
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summarizer-title"
        onClick={onClose} // Close on overlay click
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-700">
            <h2 
              id="summarizer-title" 
              className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center"
            >
              <FaRobot className="mr-2 text-primary dark:text-primary-light" /> 
              AI Note Summarizer
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <FaTimes size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-auto p-4 styled-scrollbar">
            {/* Show AI quota if user profile is available */}
            {profile?.aiUsage && !summary && !loading && !internalError && (
              <div className="mb-6">
                <AIQuotaDisplay aiUsage={profile.aiUsage} compact={true} />
              </div>
            )}
          
            {!summary && !loading && !internalError && (
              <div className="text-center py-8">
                <div className="bg-primary/10 rounded-full p-4 inline-flex mb-4">
                  <FaRobot className="text-primary dark:text-primary-light text-4xl" />
                </div>
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-100 mb-2">
                  Generate AI Summary
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                  Get a quick summary and key points from this note using AI.
                </p>
                <button
                  onClick={handleSummarize}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Summarize Note'}
                </button>
              </div>
            )}
            
            {loading && (
              <div className="text-center py-12">
                <FaSpinner className="animate-spin text-4xl text-primary dark:text-primary-light mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">Generating summary, please wait...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This may take a moment.</p>
              </div>
            )}
            
            {internalError && !loading && !summary && ( // Only show this generic error if no summary is loaded yet
              <div className="text-center py-8">
                <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4 flex flex-col items-center max-w-md mx-auto">
                  <FaTimes className="text-3xl mb-2" />
                  <p className="font-semibold text-lg">Summary Generation Failed</p>
                  <p className="text-sm mt-1">{internalError}</p>
                </div>
                <button
                  onClick={handleSummarize} 
                  className="btn bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 mt-4"
                >
                  Try Again
                </button>
              </div>
            )}
            
            {summary && !loading && ( // Display summary if available
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200 dark:border-slate-600">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                      <FaRobot className="mr-3 text-primary dark:text-primary-light text-2xl" /> AI-Generated Insights
                    </h3>
                    <span 
                      title="Content generated by AI"
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-700 dark:text-sky-200"
                    >
                      <FaRobot className="mr-1.5" /> AI Enhanced
                    </span>
                  </div>
                  
                  {summary.summary ? (
                    <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-md">
                      <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-1">Summary:</h4>
                      <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">
                        {summary.summary}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-700/30 rounded-md text-center">
                      <p className="text-yellow-700 dark:text-yellow-300 italic text-sm">
                        AI could not generate a textual summary for this note.
                      </p>
                    </div>
                  )}

                  {summary.keyPoints && summary.keyPoints.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-md">
                      <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Key Points:</h4>
                      <ul className="list-disc list-inside space-y-1.5 text-gray-600 dark:text-gray-300 text-sm">
                        {summary.keyPoints.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {summary.generatedAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-right">
                      <i>Generated: {new Date(summary.generatedAt).toLocaleString()}</i>
                    </p>
                  )}
                </div>

                {!studyComplete && profile && ( // Only show if user is logged in
                  <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Actions:</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={copyToClipboard}
                        className="btn btn-secondary w-full sm:w-auto flex items-center justify-center"
                        title={copied ? "Copied!" : "Copy summary & key points"}
                      >
                        {copied ? <FaCheck className="mr-2 text-green-500" /> : <FaCopy className="mr-2" />} 
                        {copied ? 'Copied' : 'Copy Text'}
                      </button>
                      <button
                        onClick={handleCompleteStudy}
                        className={`btn ${studyComplete ? 'btn-success' : 'btn-primary'} w-full sm:w-auto flex items-center justify-center`}
                        disabled={completingStudy || studyComplete}
                      >
                        {completingStudy ? (
                          <FaSpinner className="animate-spin mr-2" /> 
                        ) : studyComplete ? (
                          <FaCheck className="mr-2" />
                        ) : (
                          <FaBookmark className="mr-2" />
                        )}
                        {completingStudy ? 'Recording...' : studyComplete ? 'Study Complete!' : 'Mark as Studied'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AISummarizer; 