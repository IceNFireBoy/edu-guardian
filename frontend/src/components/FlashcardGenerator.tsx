import React, { useState } from 'react';

interface FlashcardGeneratorProps {
  noteId?: string;
  noteContent?: string;
}

const FlashcardGenerator: React.FC<FlashcardGeneratorProps> = ({ noteId, noteContent }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState<any[]>([]);

  const generateFlashcards = async () => {
    try {
      setIsGenerating(true);
      // Mock flashcard generation
      setTimeout(() => {
        setFlashcards([
          { id: 1, question: "Sample question 1?", answer: "Sample answer 1" },
          { id: 2, question: "Sample question 2?", answer: "Sample answer 2" }
        ]);
        setIsGenerating(false);
      }, 1000);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="flashcard-generator">
      <h2 className="text-xl font-bold mb-4">Flashcard Generator</h2>
      
      <button 
        onClick={generateFlashcards}
        disabled={isGenerating}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isGenerating ? 'Generating...' : 'Generate Flashcards'}
      </button>
      
      {flashcards.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Generated Flashcards:</h3>
          <div className="space-y-4">
            {flashcards.map(card => (
              <div key={card.id} className="border p-4 rounded">
                <p className="font-medium">Q: {card.question}</p>
                <p className="mt-2">A: {card.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardGenerator; 