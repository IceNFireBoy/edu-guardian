import React, { useState, useEffect } from 'react';
import { useFlashcards } from '../../context/FlashcardContext';
import type { Flashcard as FlashcardType } from '../../types/flashcard';
import Button from '../ui/Button'; // TSX version

interface FlashcardProps {
  card: FlashcardType; // Use the type imported from context
}

const FlashcardComponent: React.FC<FlashcardProps> = ({ card }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { recordResponse } = useFlashcards();

  // Reset flip state when card prop changes
  useEffect(() => {
    setIsFlipped(false);
  }, [card]);

  if (!card) {
    return <p className="text-center text-gray-500 dark:text-gray-400 p-4">No card data provided.</p>;
  }

  const { question, answer, _id: cardId } = card;

  const handleResponse = (status: 'correct' | 'incorrect') => {
    recordResponse(status); // context knows the current card
    // Consider adding visual feedback before/instead of auto-advance
  };

  const handleFlip = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent clicks bubbling up if nested
    setIsFlipped(!isFlipped);
  };

  // Prevent clicks on the card body from flipping it when showing the answer buttons
  const handleCardClick = (e: React.MouseEvent) => {
    if (!isFlipped) {
      handleFlip(e);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Allow flipping with Space or Enter when focused on the card itself
    if ((e.key === ' ' || e.key === 'Enter') && !isFlipped) {
        handleFlip(e);
    }
  };

  return (
    <div 
      className={`relative w-full max-w-md min-h-[20rem] h-auto rounded-xl shadow-lg perspective group `}
      role="button"
      tabIndex={0}
      onClick={handleCardClick} 
      onKeyPress={handleKeyPress}
      aria-label={`Flashcard. Question: ${question}. Press Space or Enter to show answer.`}
    >
      {/* Inner container for 3D transform */}
      <div className={`relative w-full h-full preserve-3d transition-transform duration-500 ease-in-out ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front Face (Question) */}
        <div className="absolute w-full h-full backface-hidden flex flex-col justify-between items-center p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex-grow flex flex-col items-center justify-center w-full overflow-hidden">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Question</h3>
            <p className="text-lg text-center text-gray-800 dark:text-gray-100 overflow-y-auto max-h-[12rem]">{question}</p>
          </div>
          <div className="mt-4 w-full">
            <Button 
                onClick={handleFlip}
                className="btn-primary w-full"
                aria-label="Show answer"
            >
                Show Answer
            </Button>
          </div>
        </div>

        {/* Back Face (Answer) */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col justify-between items-center p-5 rounded-xl bg-sky-50 dark:bg-sky-900 border border-sky-200 dark:border-sky-700">
          <div className="flex-grow flex flex-col items-center justify-center w-full overflow-hidden">
             <h3 className="text-sm font-medium text-sky-600 dark:text-sky-300 mb-2 uppercase tracking-wide">Answer</h3>
             <p className="text-lg text-center text-sky-800 dark:text-sky-100 overflow-y-auto max-h-[10rem]">{answer}</p>
          </div>
          {/* Response Buttons */}
          <div className="mt-4 w-full flex justify-around items-center space-x-3">
            <Button 
              onClick={(e) => { e.stopPropagation(); handleResponse('incorrect'); }}
              className="btn-red flex-1 text-sm"
              aria-label="Mark as incorrect"
            >
              Incorrect
            </Button>
             <Button 
              onClick={handleFlip}
              className="btn-secondary flex-1 text-sm"
              aria-label="Show question"
            >
              Show Question
            </Button>
            <Button 
              onClick={(e) => { e.stopPropagation(); handleResponse('correct'); }}
              className="btn-green flex-1 text-sm"
              aria-label="Mark as correct"
            >
              Correct
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardComponent; 