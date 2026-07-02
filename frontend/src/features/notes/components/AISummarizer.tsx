import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { aiApi } from '../../../api/ai';
import { useToast } from '../../../hooks/useToast';

interface AISummarizerProps {
  noteId: string;
  initialSummary?: string;
}

/**
 * Generates (and displays) an AI summary for a note. Shows a skeleton while
 * loading, a success toast on completion, and relies on the API layer to toast
 * failures (including the daily-quota 429 message).
 */
const AISummarizer: React.FC<AISummarizerProps> = ({ noteId, initialSummary }) => {
  const toast = useToast();
  const [summary, setSummary] = useState<string>(initialSummary || '');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await aiApi.summarizeNote(noteId);
      setSummary(data.summary);
      toast.success('Summary ready!');
    } catch {
      // Error toast already shown by the API layer.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="ai-summarizer" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <Sparkles className="w-4 h-4 text-primary" /> AI Summary
        </h3>
        <button
          data-testid="ai-summarize-btn"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-white
            hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {summary ? 'Regenerate' : 'Summarize'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            data-testid="ai-summary-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 rounded bg-gray-200 dark:bg-slate-700 animate-pulse" style={{ width: `${90 - i * 15}%` }} />
            ))}
          </motion.div>
        ) : summary ? (
          <motion.p
            key="summary"
            data-testid="ai-summary-text"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed"
          >
            {summary}
          </motion.p>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Generate a concise, AI-written summary of this note's key points.
          </p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AISummarizer;
