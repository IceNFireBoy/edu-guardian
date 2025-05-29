import React, { useState } from 'react';
import { Note } from '../../types/note';

interface NoteFlashcardsProps {
  note: Note;
}

export const NoteFlashcards: React.FC<NoteFlashcardsProps> = ({ note }) => {
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const toggleCard = (cardId: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  if (!note.flashcards || note.flashcards.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        No flashcards available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Flashcards</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {note.flashcards.map(card => (
          <div
            key={card._id}
            onClick={() => toggleCard(card._id)}
            className={`relative h-48 cursor-pointer transition-transform duration-500 transform ${
              flippedCards.has(card._id) ? 'rotate-y-180' : ''
            }`}
          >
            <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 backface-hidden">
              <div className="h-full flex items-center justify-center text-center">
                <p className="text-lg text-gray-900 dark:text-white">
                  {flippedCards.has(card._id) ? card.back : card.front}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 