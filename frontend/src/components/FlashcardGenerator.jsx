import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLightbulb, FaSpinner, FaTimes, FaArrowRight, FaRedo, FaSave, FaPrint } from 'react-icons/fa';

// Mock function to generate flashcards from content
const generateFlashcards = async (content, numCards = 5) => {
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      // Simple text processing to create flashcards
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 2);
      
      // Create question-answer pairs
      const flashcards = [];
      
      // Try to find definition patterns: "X is Y" or "X refers to Y"
      const definitionRegex = /([^.!?]+)\s(is|are|refers to|means|defines|represents)\s([^.!?]+)/gi;
      let definitionMatches = Array.from(content.matchAll(definitionRegex));
      
      // Add definition-based flashcards
      for (let i = 0; i < Math.min(definitionMatches.length, 2); i++) {
        const match = definitionMatches[i];
        if (match && match[1] && match[3]) {
          const term = match[1].trim();
          const definition = match[3].trim();
          flashcards.push({
            question: `What is ${term}?`,
            answer: definition
          });
        }
      }
      
      // Add some key concept flashcards
      const keywordRegex = /\b(important|significant|key|main|primary|crucial|essential)\b/i;
      const conceptSentences = sentences.filter(s => keywordRegex.test(s));
      
      for (let i = 0; i < Math.min(conceptSentences.length, 2); i++) {
        if (conceptSentences[i]) {
          const parts = conceptSentences[i].split(',');
          if (parts.length > 1) {
            flashcards.push({
              question: `Complete this statement: "${parts[0]}..."`,
              answer: parts.slice(1).join(',')
            });
          } else {
            // Turn the sentence into a question by removing a key term
            const words = conceptSentences[i].split(' ');
            const randomIndex = Math.floor(Math.random() * words.length);
            const removedWord = words[randomIndex];
            words[randomIndex] = '______';
            
            flashcards.push({
              question: `Fill in the blank: "${words.join(' ')}"`,
              answer: removedWord
            });
          }
        }
      }
      
      // Add some general questions
      while (flashcards.length < numCards && sentences.length > 0) {
        const randomIndex = Math.floor(Math.random() * sentences.length);
        const sentence = sentences[randomIndex];
        sentences.splice(randomIndex, 1);
        
        if (sentence && sentence.length > 20) {
          if (sentence.indexOf(',') !== -1) {
            // Create a "complete the statement" flashcard
            const parts = sentence.split(',');
            flashcards.push({
              question: `Complete this statement: "${parts[0]}..."`,
              answer: parts.slice(1).join(',')
            });
          } else {
            // Create a true/false flashcard
            const isTrue = Math.random() > 0.5;
            const words = sentence.split(' ');
            
            if (isTrue) {
              flashcards.push({
                question: `True or False: "${sentence}"`,
                answer: "True"
              });
            } else {
              // Modify the sentence to make it false
              const randomWordIndex = Math.floor(Math.random() * words.length);
              const negationWords = ['never', 'not', 'rarely', 'incorrectly'];
              const randomNegation = negationWords[Math.floor(Math.random() * negationWords.length)];
              
              const originalWord = words[randomWordIndex];
              words[randomWordIndex] = randomNegation;
              const falseSentence = words.join(' ');
              
              flashcards.push({
                question: `True or False: "${falseSentence}"`,
                answer: `False. The correct statement is: "${sentence}"`
              });
            }
          }
        }
      }
      
      resolve(flashcards);
    }, 2000); // 2 second delay to simulate processing
  });
};

const Flashcard = ({ flashcard, index, isActive, onFlip }) => {
  const [flipped, setFlipped] = useState(false);
  
  const handleFlip = () => {
    setFlipped(!flipped);
    if (onFlip) onFlip(index);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`${isActive ? 'block' : 'hidden'} w-full h-full`}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden cursor-pointer h-full"
        onClick={handleFlip}
      >
        <div className="flex flex-col h-full">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 flex justify-between items-center">
            <span className="text-sm font-medium">Card {index + 1}</span>
            <button
              className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
              onClick={(e) => {
                e.stopPropagation();
                handleFlip();
              }}
              aria-label={flipped ? "Show question" : "Show answer"}
            >
              <FaArrowRight className={`transition-transform duration-300 ${flipped ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <div className="flex-grow p-4 flex items-center justify-center relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {!flipped ? (
                  <motion.div
                    key="question"
                    initial={{ opacity: 0, rotateY: -180 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: 180 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full flex items-center justify-center p-4"
                  >
                    <p className="text-center text-gray-800 dark:text-gray-100 font-medium">
                      {flashcard.question}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="answer"
                    initial={{ opacity: 0, rotateY: 180 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: -180 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20"
                  >
                    <p className="text-center text-gray-800 dark:text-gray-100">
                      {flashcard.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Click to {flipped ? 'see question' : 'reveal answer'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FlashcardGenerator = ({ isOpen, onClose, noteContent, noteTitle }) => {
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentCard, setCurrentCard] = useState(0);
  
  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add a check to ensure we have content to process
      if (!noteContent || noteContent.trim().length < 50) {
        throw new Error('Not enough content to generate flashcards. Please provide more text.');
      }
      
      const result = await generateFlashcards(noteContent);
      setFlashcards(result);
      setCurrentCard(0);
    } catch (err) {
      console.error('Flashcard generation error:', err);
      setError(err.message || 'Failed to generate flashcards');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegenerateCard = async (index) => {
    try {
      // Generate a single new flashcard to replace the current one
      const newCard = await generateFlashcards(noteContent, 1);
      if (newCard && newCard.length > 0) {
        const updatedFlashcards = [...flashcards];
        updatedFlashcards[index] = newCard[0];
        setFlashcards(updatedFlashcards);
      }
    } catch (err) {
      console.error('Error regenerating flashcard:', err);
    }
  };
  
  const nextCard = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
    }
  };
  
  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
    }
  };
  
  const handleSaveFlashcards = () => {
    try {
      // Format the flashcards for saving
      const flashcardData = {
        title: noteTitle || 'Untitled Flashcards',
        cards: flashcards,
        createdAt: new Date().toISOString()
      };
      
      // Get existing saved flashcards or initialize empty array
      const savedFlashcardsJSON = localStorage.getItem('saved_flashcards') || '[]';
      const savedFlashcards = JSON.parse(savedFlashcardsJSON);
      
      // Add new flashcards and save back to localStorage
      savedFlashcards.push(flashcardData);
      localStorage.setItem('saved_flashcards', JSON.stringify(savedFlashcards));
      
      // Show success message (in a real app, would use toast)
      alert('Flashcards saved successfully!');
    } catch (err) {
      console.error('Error saving flashcards:', err);
      alert('Failed to save flashcards');
    }
  };
  
  const handlePrintFlashcards = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to print flashcards.');
      return;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Flashcards: ${noteTitle || 'Untitled'}</title>
        <style>
          body { font-family: Arial, sans-serif; }
          .flashcard {
            page-break-inside: avoid;
            border: 1px solid #ccc;
            border-radius: 8px;
            margin-bottom: 20px;
            padding: 15px;
          }
          .question { font-weight: bold; margin-bottom: 20px; }
          .answer { border-top: 1px dashed #ccc; padding-top: 15px; }
          h1 { margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <h1>Flashcards: ${noteTitle || 'Untitled'}</h1>
        ${flashcards.map((fc, i) => `
          <div class="flashcard">
            <div class="question">${i+1}. ${fc.question}</div>
            <div class="answer">${fc.answer}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
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
        aria-labelledby="flashcard-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-700">
            <h2 
              id="flashcard-title" 
              className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center"
            >
              <FaLightbulb className="mr-2 text-yellow-500" /> 
              Flashcard Generator
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
          <div className="flex-1 overflow-auto p-4">
            {!flashcards.length && !loading && !error && (
              <div className="text-center py-8">
                <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-full p-4 inline-flex mb-4">
                  <FaLightbulb className="text-yellow-500 text-4xl" />
                </div>
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-100 mb-2">
                  Generate Study Flashcards
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                  Turn this note into a set of study flashcards with questions and answers to help you review the material.
                </p>
                <button
                  onClick={handleGenerate}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  Generate Flashcards
                </button>
              </div>
            )}
            
            {loading && (
              <div className="text-center py-12">
                <FaSpinner className="animate-spin text-4xl text-primary dark:text-primary-light mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">Generating flashcards...</p>
              </div>
            )}
            
            {error && (
              <div className="text-center py-8">
                <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4">
                  {error}
                </div>
                <button
                  onClick={() => setError(null)}
                  className="btn bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Try Again
                </button>
              </div>
            )}
            
            {flashcards.length > 0 && (
              <div>
                <div className="mb-6 h-64">
                  {flashcards.map((flashcard, index) => (
                    <Flashcard 
                      key={index} 
                      flashcard={flashcard} 
                      index={index} 
                      isActive={index === currentCard}
                      onFlip={() => {}}
                    />
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={prevCard}
                    disabled={currentCard === 0}
                    className={`px-4 py-2 rounded-lg ${currentCard === 0 
                      ? 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                  >
                    Previous
                  </button>
                  
                  <div className="text-gray-600 dark:text-gray-300">
                    Card {currentCard + 1} of {flashcards.length}
                  </div>
                  
                  <button
                    onClick={nextCard}
                    disabled={currentCard === flashcards.length - 1}
                    className={`px-4 py-2 rounded-lg ${currentCard === flashcards.length - 1 
                      ? 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                  >
                    Next
                  </button>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={() => handleRegenerateCard(currentCard)}
                    className="flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 mr-4"
                  >
                    <FaRedo className="mr-2" /> Regenerate This Card
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          {flashcards.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {flashcards.length} flashcards generated
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handlePrintFlashcards}
                  className="btn bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center"
                >
                  <FaPrint className="mr-2" /> Print
                </button>
                <button
                  onClick={handleSaveFlashcards}
                  className="btn btn-primary flex items-center"
                >
                  <FaSave className="mr-2" /> Save Flashcards
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FlashcardGenerator; 