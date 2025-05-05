import React, { useState, useEffect } from 'react';
import { FaFlag, FaTimes } from 'react-icons/fa';

/**
 * Component that allows marking a note as completed with emoji-based feedback
 */
const FinishStudyingButton = ({ noteId, onFinish, initialStartTime, subject }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [startTime, setStartTime] = useState(initialStartTime || Date.now());
  
  // Emoji options with their meanings
  const emojiOptions = [
    { emoji: "🤓", meaning: "Understood" },
    { emoji: "🤔", meaning: "Confused" },
    { emoji: "❗", meaning: "Need Help" }
  ];
  
  useEffect(() => {
    // If initialStartTime wasn't provided, use current time
    if (!initialStartTime) {
      setStartTime(Date.now());
    }
  }, [initialStartTime]);
  
  // Calculate time spent in minutes
  const calculateTimeSpent = () => {
    const now = Date.now();
    const timeSpentMs = now - startTime;
    return Math.round(timeSpentMs / (1000 * 60)); // Convert to minutes
  };
  
  // Handle when the Finish Studying button is clicked
  const handleFinishClick = () => {
    setShowFeedback(true);
  };
  
  // Handle when a specific emoji is selected
  const handleEmojiSelect = (emoji) => {
    const timeSpent = calculateTimeSpent();
    
    // Standardize subject
    let standardizedSubject = subject || 'Uncategorized';
    if (standardizedSubject.includes('Biology') || standardizedSubject === 'Biology 12') {
      standardizedSubject = 'Biology';
    }
    
    // Store completion data in localStorage
    const completedNotes = JSON.parse(localStorage.getItem('completedNotes') || '[]');
    
    // Check if note is already in completed notes
    const existingNoteIndex = completedNotes.findIndex(note => note.id === noteId);
    
    const completionData = {
      id: noteId,
      completedAt: new Date().toISOString(),
      timeSpent: timeSpent,
      feedback: emoji,
      subject: standardizedSubject
    };
    
    // Update or add the note
    if (existingNoteIndex >= 0) {
      completedNotes[existingNoteIndex] = {
        ...completedNotes[existingNoteIndex],
        ...completionData
      };
    } else {
      completedNotes.push(completionData);
    }
    
    localStorage.setItem('completedNotes', JSON.stringify(completedNotes));
    
    // Call the onFinish callback with completion data
    if (onFinish && typeof onFinish === 'function') {
      onFinish({
        noteId,
        timeSpent,
        feedback: emoji,
        subject: completionData.subject
      });
    }
    
    // Hide the feedback dialog
    setShowFeedback(false);
  };
  
  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={handleFinishClick}
        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors shadow-sm"
      >
        <FaFlag className="mr-2" />
        Finish Studying
      </button>
      
      {/* Emoji Feedback Dialog */}
      {showFeedback && (
        <div className="absolute z-50 top-0 right-0 mt-12 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 w-72 border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              How did you find this material?
            </h3>
            <button 
              onClick={() => setShowFeedback(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FaTimes />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {emojiOptions.map((option) => (
              <button
                key={option.emoji}
                onClick={() => handleEmojiSelect(option.emoji)}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-2xl mb-1">{option.emoji}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{option.meaning}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinishStudyingButton; 