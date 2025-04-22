import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaSpinner, FaTimes, FaCopy, FaCheck } from 'react-icons/fa';

// Mock AI summarization function
// In a real app, this would call an API or use a library
const generateSummary = async (content) => {
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      // Simple text summarization logic
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const keywordRegex = /\b(important|significant|key|main|critical|essential|fundamental|crucial|vital|primary)\b/i;
      
      // Select sentences with keywords or first/last sentences
      let selectedSentences = sentences
        .filter((sentence, index) => 
          keywordRegex.test(sentence) || 
          index === 0 || 
          index === sentences.length - 1 ||
          Math.random() > 0.7 // Randomly select some sentences to add variety
        )
        .slice(0, 5); // Limit to 5 sentences for brevity
      
      // Format the summary
      const summary = {
        mainPoints: selectedSentences.map(s => s.trim()),
        keyTerms: extractKeyTerms(content),
        readingTime: Math.ceil(content.split(' ').length / 200) // Approx reading time in minutes
      };
      
      resolve(summary);
    }, 2000); // 2 second delay to simulate processing
  });
};

// Extract key terms from content
const extractKeyTerms = (content) => {
  const words = content.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const frequencies = {};
  
  words.forEach(word => {
    if (
      !['this', 'that', 'with', 'from', 'have', 'they', 'will', 'what', 'when', 'where', 'which'].includes(word)
    ) {
      frequencies[word] = (frequencies[word] || 0) + 1;
    }
  });
  
  return Object.entries(frequencies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
};

const AISummarizer = ({ isOpen, onClose, noteContent, noteTitle }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const handleSummarize = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add a check to ensure we have content to summarize
      if (!noteContent || noteContent.trim().length < 10) {
        throw new Error('Not enough content to summarize');
      }
      
      const result = await generateSummary(noteContent);
      setSummary(result);
    } catch (err) {
      console.error('Summarization error:', err);
      setError(err.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    if (!summary) return;
    
    const textToCopy = `
Summary of "${noteTitle || 'Note'}":

Main Points:
${summary.mainPoints.map(point => `• ${point}`).join('\n')}

Key Terms: ${summary.keyTerms.join(', ')}

Estimated Reading Time: ${summary.readingTime} minute${summary.readingTime !== 1 ? 's' : ''}
    `.trim();
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
        aria-labelledby="summarizer-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-700">
            <h2 
              id="summarizer-title" 
              className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center"
            >
              <FaRobot className="mr-2 text-primary dark:text-primary-light" /> 
              AI Note Summarizer
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
            {!summary && !loading && !error && (
              <div className="text-center py-8">
                <div className="bg-primary/10 rounded-full p-4 inline-flex mb-4">
                  <FaRobot className="text-primary dark:text-primary-light text-4xl" />
                </div>
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-100 mb-2">
                  Generate AI Summary
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                  Get a quick summary of the key points and important information from this note.
                </p>
                <button
                  onClick={handleSummarize}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  Summarize Note
                </button>
              </div>
            )}
            
            {loading && (
              <div className="text-center py-12">
                <FaSpinner className="animate-spin text-4xl text-primary dark:text-primary-light mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">Generating summary...</p>
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
            
            {summary && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 inline-flex items-center justify-center mr-2">1</span>
                    Main Points
                  </h3>
                  <ul className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg space-y-2">
                    {summary.mainPoints.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 text-blue-500">•</span>
                        <span className="text-gray-800 dark:text-gray-100">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 inline-flex items-center justify-center mr-2">2</span>
                    Key Terms
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {summary.keyTerms.map((term, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-sm"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 inline-flex items-center justify-center mr-2">3</span>
                    Reading Time
                  </h3>
                  <p className="text-gray-800 dark:text-gray-100">
                    This note takes approximately {summary.readingTime} minute{summary.readingTime !== 1 ? 's' : ''} to read.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          {summary && (
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Generated using AI summarization
              </p>
              <button
                onClick={copyToClipboard}
                className="btn btn-primary flex items-center"
                disabled={copied}
              >
                {copied ? (
                  <>
                    <FaCheck className="mr-2" /> Copied
                  </>
                ) : (
                  <>
                    <FaCopy className="mr-2" /> Copy Summary
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AISummarizer; 