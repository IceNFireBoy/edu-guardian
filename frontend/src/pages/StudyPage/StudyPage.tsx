import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { callAuthenticatedApi, ApiResponse } from '../../api/notes'; // TS version
import toast from 'react-hot-toast';
import FlashcardViewer from '../../components/flashcards/FlashcardViewer'; // Update to .tsx (or omit extension)
import Button from '../../components/ui/Button'; // Update to .tsx (or omit extension)
import Card from '../../components/ui/Card'; // Update to .tsx (or omit extension)
import LoadingSpinner from '../../components/LoadingSpinner'; // Corrected path to TSX version
import { FlashcardProvider } from '../../context/FlashcardContext'; // Update to .tsx (or omit extension)

interface StudyPageParams extends Record<string, string | undefined> {
  noteId: string;
}

interface SummaryResponse extends ApiResponse {
  summary?: string | null;
  message?: string;
  // Add any other fields expected in the summary API response
}

const StudyPage: React.FC = () => {
  const { noteId } = useParams<StudyPageParams>();
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // TODO: Implement actual premium user check from auth context or user profile
  const isPremiumUser: boolean = true; // Placeholder

  const fetchSummary = useCallback(async (forceRegenerate: boolean = false) => {
    if (summary && !forceRegenerate && !isLoadingSummary) {
      // If summary exists, not forcing regeneration, and not already loading, show cached message.
      // This prevents multiple toasts if button is spammed.
      toast.success('Summary loaded from cache.');
      return;
    }
    setIsLoadingSummary(true);
    setSummaryError(null);
    try {
      const payload = forceRegenerate ? { regenerate: true } : {};
      // Make sure callAuthenticatedApi is correctly typed to handle SummaryResponse
      const data = await callAuthenticatedApi<SummaryResponse>(
        `/api/v1/notes/${noteId}/summarize`,
        'POST',
        payload
      );
      
      if (data.success) {
        if (data.summary) {
          setSummary(data.summary);
          toast.success(data.message || 'Summary generated successfully!');
        } else if (data.summary === null) { // Explicitly null summary is a valid state
          setSummary(null);
          toast.info(data.message || 'Summary processed, but no content was generated this time.');
        } else {
          // If success is true but summary is undefined (not null)
          setSummary(null); // Default to null
          toast.error('Summary data not found in response, though request succeeded.');
        }
      } else {
        throw new Error(data.error || 'Failed to fetch summary due to an unknown API error.');
      }
    } catch (error: any) {
      console.error("Error fetching summary:", error);
      const errorMessage = error.message || 'Failed to fetch summary. Please try again.';
      setSummaryError(errorMessage);
      toast.error(errorMessage);
    }
    setIsLoadingSummary(false);
  }, [noteId, summary, isLoadingSummary]); // Added isLoadingSummary to dependency array

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Study Session: <span className="text-primary">Note {noteId}</span>
      </h1>

      <Card className="mb-8 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-slate-200">AI Generated Summary</h2>
        {isLoadingSummary && (
          <div className="flex justify-center items-center py-4">
            <LoadingSpinner size="md" color="primary" />
            <p className="ml-2 text-gray-600 dark:text-gray-300">Generating summary...</p>
          </div>
        )}
        {summaryError && <p className="text-red-500 p-3 bg-red-50 dark:bg-red-900/30 rounded-md">Error: {summaryError}</p>}
        
        {summary && !isLoadingSummary && (
          <div className="prose dark:prose-invert max-w-none p-4 bg-gray-50 dark:bg-slate-700 rounded-md max-h-72 overflow-y-auto border border-gray-200 dark:border-slate-600">
            <p>{summary}</p>
          </div>
        )}
        
        {!summary && !isLoadingSummary && !summaryError && (
          <p className="text-gray-500 dark:text-gray-400 italic py-4">No summary generated yet. Click the button to generate one.</p>
        )}
        
        <div className="mt-5 flex flex-wrap gap-3">
          <Button 
            onClick={() => fetchSummary()} 
            disabled={isLoadingSummary || (!!summary && !isPremiumUser)} 
            className={`${(!!summary && !isPremiumUser && !isLoadingSummary) ? 'btn-disabled' : 'btn-green'}`}
          >
            {isLoadingSummary ? 'Generating...' : (summary ? (isPremiumUser ? 'Regenerate Summary' : 'Summary Generated') : 'Generate Summary')}
          </Button>
          
          {summary && isPremiumUser && (
             <Button 
                onClick={() => fetchSummary(true)} // Force regenerate
                disabled={isLoadingSummary}
                className='btn-purple'
              >
                {isLoadingSummary ? 'Regenerating...' : 'Force Regenerate (Premium)'}
            </Button>
          )}
        </div>
        {summary && !isPremiumUser && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Regenerating summaries is a premium feature.</p>}
      </Card>

      {/* Flashcard Section */}
      <FlashcardProvider noteId={noteId || ''}>
        <Card className="shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-slate-200">Flashcards</h2>
          {/* FlashcardViewer will handle its own loading/empty states */}
          <FlashcardViewer />
        </Card>
      </FlashcardProvider>
    </div>
  );
};

export default StudyPage; 