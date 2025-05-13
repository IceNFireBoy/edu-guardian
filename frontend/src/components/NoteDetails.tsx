import React, { useState } from 'react';

interface NoteDetailsProps {
  noteId?: string;
  noteContent?: string;
}

const NoteDetails: React.FC<NoteDetailsProps> = ({ noteId, noteContent }) => {
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <div className="note-details">
      <div className="tabs flex border-b mb-4">
        <button 
          className={`px-4 py-2 ${activeTab === 'summary' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'flashcards' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
          onClick={() => setActiveTab('flashcards')}
        >
          Flashcards
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'quiz' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
          onClick={() => setActiveTab('quiz')}
        >
          Quiz
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'summary' && (
          <div className="summary-tab">
            <h3 className="text-lg font-semibold mb-2">AI-Generated Summary</h3>
            <p>This is a placeholder for the AI-generated summary of the note content.</p>
            <button className="mt-4 px-3 py-1 bg-blue-500 text-white rounded">
              Generate Summary
            </button>
          </div>
        )}

        {activeTab === 'flashcards' && (
          <div className="flashcards-tab">
            <h3 className="text-lg font-semibold mb-2">Flashcards</h3>
            <p>Create flashcards from this note to help with your study sessions.</p>
            <button className="mt-4 px-3 py-1 bg-blue-500 text-white rounded">
              Generate Flashcards
            </button>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="quiz-tab">
            <h3 className="text-lg font-semibold mb-2">Quiz</h3>
            <p>Test your knowledge with an AI-generated quiz based on this note.</p>
            <button className="mt-4 px-3 py-1 bg-blue-500 text-white rounded">
              Generate Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteDetails; 