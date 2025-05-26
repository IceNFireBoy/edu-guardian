import React from 'react';
import { useFlashcards } from '../../context/FlashcardContext'; // TSX version
import Flashcard from './Flashcard'; // Update to .tsx (or omit extension)
import Button from '../ui/Button'; // TSX version
import LoadingSpinner from '../LoadingSpinner'; // Corrected path to TSX version

const FlashcardViewer: React.FC = () => {
  const {
    flashcards,
    currentCardIndex,
    isLoading,
    error,
    generateFlashcards,
    goToNextCard,
    goToPreviousCard,
    shuffleCards,
    unshuffleCards,
    isShuffled,
    showGenerationButton,
    noteId,
  } = useFlashcards();

  const handleGenerateFlashcards = (e: React.MouseEvent) => {
    e.preventDefault();
    if (noteId) {
      generateFlashcards(noteId);
    }
  };

  // Scenario 1: Initial loading state (no cards fetched yet)
  if (isLoading && flashcards.length === 0) {
    return (
      <div className="text-center py-10">
        <LoadingSpinner size="lg" color="primary" />
        <p className="mt-3 text-gray-600 dark:text-gray-300">Loading flashcards...</p>
      </div>
    );
  }

  // Scenario 2: Error during initial fetch, allow retry
  if (error && flashcards.length === 0 && showGenerationButton) {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-red-500 dark:text-red-400 mb-4 text-lg">Error: {error}</p>
        <Button onClick={handleGenerateFlashcards} disabled={isLoading} className="btn-red">
          {isLoading ? 'Generating...' : 'Try Generating Again'}
        </Button>
      </div>
    );
  }
  
  // Scenario 3: Initial state, no cards, no error, button to generate for the first time
  if (showGenerationButton && flashcards.length === 0 && !isLoading && !error) {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">No flashcards available for this note yet.</p>
        <Button onClick={handleGenerateFlashcards} disabled={isLoading} className="btn-green">
          {isLoading ? <LoadingSpinner size="sm" /> : 'Generate Flashcards'}
        </Button>
      </div>
    );
  }

  // Scenario 4: Generation was attempted/successful but yielded no cards.
  if (flashcards.length === 0 && !isLoading && !showGenerationButton) {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
          No flashcards could be generated for this note. The content might not be suitable or long enough.
        </p>
        <Button onClick={handleGenerateFlashcards} disabled={isLoading} className="btn-blue">
          {isLoading ? <LoadingSpinner size="sm" /> : 'Try Generating Again'}
        </Button>
      </div>
    );
  }
  
  const currentCardData = flashcards[currentCardIndex];

  // Main viewer when cards are present
  return (
    <div className="w-full flex flex-col items-center py-6 space-y-6">
      {/* Loading indicator when regenerating or performing actions on existing cards */}
      {isLoading && flashcards.length > 0 && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center z-10 rounded-lg">
            <LoadingSpinner size="lg" color="primary"/>
        </div>
      )}
      
      {/* Error display when actions fail on existing cards */}
      {error && flashcards.length > 0 && (
        <p className="text-red-500 dark:text-red-400 text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-md">Error: {error}</p>
      )}
      
      {flashcards.length > 0 && currentCardData && (
        <Flashcard card={currentCardData} />
      )}
      
      {/* Navigation and Card Count */} 
      {flashcards.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center w-full max-w-lg space-y-3 sm:space-y-0 sm:space-x-4">
          <Button 
            onClick={goToPreviousCard} 
            disabled={isLoading || flashcards.length <= 1}
            className='btn-secondary flex-1 sm:flex-none'
            aria-label="Previous card"
          >
            Previous
          </Button>
          <p className="text-md text-gray-700 dark:text-slate-300 order-first sm:order-none">
            Card {currentCardIndex + 1} of {flashcards.length}
          </p>
          <Button 
            onClick={goToNextCard} 
            disabled={isLoading || flashcards.length <= 1}
            className='btn-secondary flex-1 sm:flex-none'
            aria-label="Next card"
          >
            Next
          </Button>
        </div>
      )}

      {/* Action Buttons */} 
      {flashcards.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-3 border-t dark:border-gray-700 pt-6 w-full max-w-lg">
            <Button 
                onClick={handleGenerateFlashcards}
                disabled={isLoading} 
                className="btn-indigo text-sm"
            >
                {isLoading && flashcards.length > 0 ? 'Regenerating...' : 'Regenerate All'}
            </Button>
            <Button 
                onClick={isShuffled ? unshuffleCards : shuffleCards} 
                disabled={isLoading || flashcards.length < 2} 
                className="btn-purple text-sm"
            >
                {isShuffled ? 'Unshuffle Cards' : 'Shuffle Cards'}
            </Button>
        </div>
      )}
    </div>
  );
};

export default FlashcardViewer; 