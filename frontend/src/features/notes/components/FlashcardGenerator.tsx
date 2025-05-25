import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLightbulb, FaSpinner, FaTimes, FaArrowRight, FaRedo, FaSave, FaPrint, FaCheck, FaBookmark, FaAward } from 'react-icons/fa';
import { useNote } from '../useNote';
import { Flashcard as FlashcardType, NewlyAwardedBadgeInfo } from '../noteTypes'; // Renamed to avoid conflict & Added NewlyAwardedBadgeInfo
import { toast } from 'react-hot-toast';
import { useUser } from '../../user/useUser';
import AIQuotaDisplay from '../../user/components/AIQuotaDisplay';
import BadgeGrid from '../../user/components/BadgeGrid';
import { callAuthenticatedApi } from '../../../api/apiClient';

interface IndividualFlashcardProps {
  flashcard: FlashcardType;
  index: number;
  isActive: boolean;
  onFlip?: (index: number) => void;
}

const IndividualFlashcard: React.FC<IndividualFlashcardProps> = ({ flashcard, index, isActive, onFlip }) => {
  const [flipped, setFlipped] = useState(false);
  
  useEffect(() => {
    // Reset flip state when card becomes inactive or flashcard data changes
    if (!isActive) {
      setFlipped(false);
    }
  }, [isActive, flashcard]);

  const handleFlip = () => {
    setFlipped(!flipped);
    if (onFlip) onFlip(index);
  };
  
  if (!flashcard) return null; // Should not happen if flashcards array is filtered

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }} // Simplified delay for active card
      className={`${isActive ? 'block' : 'hidden'} w-full h-full`}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden cursor-pointer h-full"
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? handleFlip() : null}
        aria-pressed={flipped}
      >
        <div className="flex flex-col h-full">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 flex justify-between items-center">
            <span className="text-sm font-medium">Card {index + 1}</span>
            <button
              type="button"
              className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => {
                e.stopPropagation();
                handleFlip();
              }}
              aria-label={flipped ? "Show question" : "Show answer"}
            >
              <FaArrowRight className={`transition-transform duration-300 ${flipped ? 'transform rotate-180' : ''}`} />
            </button>
          </div>
          
          <div className="flex-grow p-4 flex items-center justify-center relative min-h-[150px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {!flipped ? (
                  <motion.div
                    key="question"
                    initial={{ opacity: 0, rotateY: -90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: 90 }}
                    transition={{ duration: 0.25 }}
                    className="w-full h-full flex items-center justify-center p-4"
                  >
                    <p className="text-center text-gray-800 dark:text-gray-100 font-medium text-lg">
                      {flashcard.question}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="answer"
                    initial={{ opacity: 0, rotateY: 90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: -90 }}
                    transition={{ duration: 0.25 }}
                    className="w-full h-full flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20"
                  >
                    <p className="text-center text-gray-800 dark:text-gray-100 text-md">
                      {flashcard.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="p-3 border-t border-gray-200 dark:border-slate-700 flex justify-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Click card to {flipped ? 'see question' : 'reveal answer'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface FlashcardGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  noteTitle?: string;
}

interface SavedFlashcardSet {
  id: string; // Use noteId as id for simplicity or generate a new one
  title: string;
  cards: FlashcardType[];
  createdAt: string;
}

const FlashcardGenerator: React.FC<FlashcardGeneratorProps> = ({ isOpen, onClose, noteId, noteTitle }) => {
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const {
    generateFlashcards: generateFlashcardsFromHook,
    saveFlashcards,
    loading: noteHookLoading,
    error: noteHookError 
  } = useNote();
  
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { profile, fetchUserProfile, completeStudy, newBadgeIds: userNewBadgeIds } = useUser();
  const [studyComplete, setStudyComplete] = useState(false);
  const [completingStudy, setCompletingStudy] = useState(false);
  const [showBadges, setShowBadges] = useState(false);

  useEffect(() => {
    setInternalError(noteHookError);
  }, [noteHookError]);

  useEffect(() => {
    if (!isOpen) {
      setFlashcards([]);
      setCurrentCardIndex(0);
      setInternalError(null);
      setStudyComplete(false);
      setShowBadges(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (userNewBadgeIds && userNewBadgeIds.length > 0) {
      setShowBadges(true);
    }
  }, [userNewBadgeIds]);

  const handleGenerate = async () => {
    if (!noteId) {
      setInternalError('Note ID is missing, cannot generate flashcards.');
      toast.error('Note ID is missing.');
      return;
    }
    setInternalError(null);
    setFlashcards([]);
    setCurrentCardIndex(0);
    setIsLoading(true);
    const toastId = toast.loading('Generating AI Flashcards...');

    try {
      const response = await generateFlashcardsFromHook(noteId);
      toast.dismiss(toastId);
      if (response && response.data && response.data.length > 0) {
        setFlashcards(response.data);
        setCurrentCardIndex(0);
        toast.success(`${response.data.length} flashcards generated! Preview them below.`);
        
        if (response.newlyAwardedBadges && response.newlyAwardedBadges.length > 0) {
          fetchUserProfile();
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
      } else if (!noteHookError && response.data.length === 0) { 
        const specificError = "AI couldn't generate flashcards for this note. The content might be too short or unsuitable.";
        setInternalError(specificError);
        toast.error(specificError);
        setFlashcards([]);
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      const message = err.message || 'An unexpected error occurred during flashcard generation.';
      setInternalError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFlashcards = async () => {
    if (!noteId || flashcards.length === 0) {
      toast.error('No flashcards to save or Note ID is missing.');
      return;
    }
    setIsSaving(true);
    setInternalError(null);
    const toastId = toast.loading('Saving flashcards to note...');

    try {
      const savedResult = await saveFlashcards(noteId, flashcards);
      toast.dismiss(toastId);

      if (savedResult) {
        toast.success('Flashcards saved to your note successfully!');
      } else {
        const errMsg = noteHookError || 'Failed to save flashcards. Please try again.';
        setInternalError(errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      const message = err.message || 'An unexpected error occurred while saving flashcards.';
      setInternalError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateAll = async () => {
    toast('Refreshing flashcards...');
    await handleGenerate();
  };
  
  const nextCard = () => {
    setCurrentCardIndex(prev => (prev < flashcards.length - 1 ? prev + 1 : prev));
  };
  
  const prevCard = () => {
    setCurrentCardIndex(prev => (prev > 0 ? prev - 1 : prev));
  };
  
  const handlePrintFlashcards = () => {
    if (flashcards.length === 0) {
      toast.error("No flashcards to print.");
      return;
    }
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Print Flashcards</title>');
      printWindow.document.write('<style>body{font-family: Arial, sans-serif; margin: 20px;} .flashcard{border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; page-break-inside: avoid;} .question{font-weight: bold; margin-bottom: 5px;} .answer{margin-left: 10px;} @media print { button { display: none; } }</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(`<h1>${noteTitle || 'Flashcards'}</h1>`);
      printWindow.document.write('<button onclick="window.print()">Print</button>');
      flashcards.forEach((card, i) => {
        printWindow.document.write('<div class="flashcard">');
        printWindow.document.write(`<p class="question">Q${i + 1}: ${card.question}</p>`);
        printWindow.document.write(`<p class="answer">A: ${card.answer}</p>`);
        printWindow.document.write('</div>');
      });
      printWindow.document.write('</body></html>');
      printWindow.document.close();
    } else {
      toast.error("Could not open print window. Please check your browser's pop-up settings.");
    }
  };

  const handleCompleteStudy = async () => {
    if (!noteId) return;
    
    setCompletingStudy(true);
    const success = await completeStudy({
      noteId,
      duration: 15,
      flashcardsReviewed: flashcards.length,
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

  const currentFlashcard = flashcards[currentCardIndex];
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
        role="dialog" aria-modal="true" aria-labelledby="flashcard-generator-title"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
            <h2 id="flashcard-generator-title" className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
              <FaLightbulb className="mr-2 text-yellow-500 dark:text-yellow-400" /> 
              AI Flashcard Generator
            </h2>
            <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" aria-label="Close">
              <FaTimes size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 styled-scrollbar">
            {profile?.aiUsage && flashcards.length === 0 && !isLoading && !internalError && (
              <div className="mb-6">
                <AIQuotaDisplay aiUsage={profile.aiUsage} compact={true} />
              </div>
            )}

            {flashcards.length === 0 && !isLoading && !internalError && (
              <div className="text-center py-12">
                <div className="bg-yellow-500/10 rounded-full p-5 inline-flex mb-6">
                  <FaLightbulb className="text-yellow-500 dark:text-yellow-400 text-5xl" />
                </div>
                <h3 className="text-2xl font-medium text-gray-800 dark:text-gray-100 mb-3">
                  Generate Flashcards with AI
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
                  Let AI create a set of flashcards from this note to supercharge your study session.
                </p>
                <button onClick={handleGenerate} className="btn btn-primary btn-lg" disabled={isLoading || isSaving}>
                  {isLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaLightbulb className="mr-2" />} 
                  {isLoading ? 'Generating...' : 'Generate Flashcards'}
                </button>
              </div>
            )}
            
            {isLoading && (
              <div className="text-center py-12">
                <FaSpinner className="animate-spin text-5xl text-yellow-500 dark:text-yellow-400 mx-auto mb-5" />
                <p className="text-xl text-gray-700 dark:text-gray-200">Generating AI Flashcards...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This might take a few moments. Please wait.</p>
              </div>
            )}
            
            {internalError && !isLoading && flashcards.length === 0 && (
              <div className="text-center py-10">
                <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-6 rounded-lg mb-6 max-w-md mx-auto shadow">
                  <FaTimes className="text-3xl text-red-500 dark:text-red-400 mx-auto mb-3" />
                  <p className="font-semibold text-lg mb-1">Flashcard Generation Failed</p>
                  <p className="text-sm">{internalError}</p>
                </div>
                <button onClick={handleGenerate} className="btn bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500" disabled={isLoading || isSaving}>
                  <FaRedo className="mr-2" /> Try Again
                </button>
              </div>
            )}
            
            {flashcards.length > 0 && !isLoading && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                    <FaCheck className="inline mr-1" /> {flashcards.length} Flashcards Generated! Review and save.
                  </p>
                  <span 
                    title="Content generated by AI"
                    className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-700 dark:text-sky-200"
                  >
                    <FaLightbulb className="mr-1.5" /> AI Enhanced
                  </span>
                </div>

                <div className="relative w-full max-w-lg mx-auto h-64 md:h-72 mb-6">
                  {flashcards.map((fc, index) => (
                    <IndividualFlashcard
                      key={index}
                      flashcard={fc}
                      index={index}
                      isActive={index === currentCardIndex}
                    />
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <button onClick={prevCard} disabled={currentCardIndex === 0 || isLoading || isSaving} className="btn btn-icon btn-secondary">
                      &larr; Prev
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Card {currentCardIndex + 1} of {flashcards.length}
                    </span>
                    <button onClick={nextCard} disabled={currentCardIndex === flashcards.length - 1 || isLoading || isSaving} className="btn btn-icon btn-secondary">
                      Next &rarr;
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <button 
                      onClick={handleRegenerateAll} 
                      className="btn btn-outline btn-secondary flex items-center" 
                      disabled={isLoading || isSaving}
                      title="Generate a new set of flashcards (will use AI quota)"
                    >
                      <FaRedo className="mr-2" /> Regenerate
                    </button>
                    <button 
                      onClick={handleSaveFlashcards} 
                      className="btn btn-primary flex items-center" 
                      disabled={isSaving || isLoading || flashcards.length === 0}
                    >
                      {isSaving ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
                      {isSaving ? 'Saving...' : 'Save to Note'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleCompleteStudy}
                    className={`btn ${studyComplete ? 'btn-success' : 'btn-primary'}`}
                    disabled={completingStudy || studyComplete}
                  >
                    {completingStudy ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Recording...
                      </>
                    ) : studyComplete ? (
                      <>
                        <FaCheck className="mr-2" />
                        Study Complete!
                      </>
                    ) : (
                      <>
                        <FaBookmark className="mr-2" />
                        Finish Studying
                      </>
                    )}
                  </button>
                </div>
                
                {showBadges && profile && profile.badges && profile.badges.length > 0 && (
                  <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-3">
                      Your Badges
                    </h3>
                    <BadgeGrid badges={profile.badges} newBadgeIds={userNewBadgeIds} />
                  </div>
                )}
                
                <p className="text-xs text-gray-500 text-center mt-6">
                  Generated: {new Date().toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FlashcardGenerator; 