import React, { useState, useEffect, useRef } from 'react';
import { FaArrowLeft, FaClock, FaCoffee, FaPlay, FaPause, FaTimes, FaExclamationTriangle, FaFilePdf } from 'react-icons/fa';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ErrorBoundary from '../ErrorBoundary';
import FinishStudyingButton from '../progress/FinishStudyingButton';

// Utility function to ensure string values
const ensureString = (value, defaultValue = '') => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') return value;
  try {
    return String(value);
  } catch (err) {
    console.error('Error converting value to string:', err);
    return defaultValue;
  }
};

const PDFViewer = ({ noteUrl, noteTitle, noteId }) => {
  const [sessionTime, setSessionTime] = useState(0); // in seconds
  const [breakTime, setBreakTime] = useState(0); // in seconds
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [showBreakOptions, setShowBreakOptions] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [studyStartTime, setStudyStartTime] = useState(Date.now());
  
  const sessionTimerRef = useRef(null);
  const breakTimerRef = useRef(null);
  const iframeRef = useRef(null);
  const navigate = useNavigate();
  
  // Validate props - with more thorough validation
  const validNoteUrl = Boolean(noteUrl && typeof noteUrl === 'string' && noteUrl.trim() !== '');
  const safeNoteTitle = ensureString(noteTitle, 'Untitled Note');
  
  // Format time in HH:MM:SS
  const formatTime = (timeInSeconds) => {
    if (typeof timeInSeconds !== 'number') return '00:00:00';
    
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    
    try {
      return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
      ].join(':');
    } catch (err) {
      console.error("Error formatting time:", err);
      return '00:00:00';
    }
  };
  
  // Start session timer on component mount
  useEffect(() => {
    try {
      sessionTimerRef.current = setInterval(() => {
        if (!isPaused && !isBreakActive) {
          setSessionTime(prev => prev + 1);
        }
      }, 1000);
      
      return () => {
        if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
        if (breakTimerRef.current) clearInterval(breakTimerRef.current);
      };
    } catch (err) {
      console.error("Error in session timer:", err);
    }
  }, [isPaused, isBreakActive]);
  
  // Start break timer when break is active
  useEffect(() => {
    try {
      if (isBreakActive) {
        breakTimerRef.current = setInterval(() => {
          setBreakTime(prev => {
            if (prev <= 1) {
              // End break when timer reaches 0
              clearInterval(breakTimerRef.current);
              setIsBreakActive(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        if (breakTimerRef.current) {
          clearInterval(breakTimerRef.current);
        }
      }
      
      return () => {
        if (breakTimerRef.current) clearInterval(breakTimerRef.current);
      };
    } catch (err) {
      console.error("Error in break timer:", err);
    }
  }, [isBreakActive]);
  
  // Handle iframe load and error events
  useEffect(() => {
    // Only set up listeners if we have a valid URL
    if (!validNoteUrl) {
      return;
    }
    
    const handleIframeLoad = () => {
      console.log("PDF iframe loaded successfully");
      setPdfLoaded(true);
      setPdfError(null);
    };
    
    const handleIframeError = (e) => {
      console.error("PDF iframe failed to load:", e);
      setPdfError("Failed to load PDF. The file might be invalid or inaccessible.");
      setPdfLoaded(false);
    };
    
    const iframe = iframeRef.current;
    
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
      
      // Error handler for the iframe
      window.addEventListener('error', (e) => {
        if (e.target === iframe) {
          handleIframeError(e);
        }
      }, true);
      
      return () => {
        iframe.removeEventListener('load', handleIframeLoad);
        // We don't remove the error listener as it's on window
      };
    }
  }, [validNoteUrl]);
  
  // Toggle pause/resume for session timer
  const togglePause = () => {
    setIsPaused(prev => !prev);
  };
  
  // Start a custom break
  const startCustomBreak = () => {
    if (!customTime || isNaN(customTime) || parseInt(customTime) <= 0) {
      return;
    }
    
    const minutes = parseInt(customTime);
    setBreakTime(minutes * 60);
    setIsBreakActive(true);
    setShowBreakOptions(false);
    setCustomTime('');
  };
  
  // Start a short break (10 minutes)
  const startShortBreak = () => {
    setBreakTime(10 * 60);
    setIsBreakActive(true);
    setShowBreakOptions(false);
  };
  
  // Start a long break (30 minutes)
  const startLongBreak = () => {
    setBreakTime(30 * 60);
    setIsBreakActive(true);
    setShowBreakOptions(false);
  };
  
  // Cancel current break
  const cancelBreak = () => {
    setIsBreakActive(false);
    setBreakTime(0);
  };
  
  // Create a safe URL for the iframe
  const getSafeUrl = () => {
    try {
      if (!validNoteUrl) return '';
      
      // Check if URL is valid and add toolbar parameter safely
      let url = noteUrl;
      
      // Add toolbar parameter if URL doesn't already have parameters
      if (url && url.indexOf('#') === -1) {
        url = `${url}#toolbar=0`;
      }
      
      return url;
    } catch (err) {
      console.error("Error creating safe URL:", err);
      setPdfError("Failed to process PDF URL");
      return '';
    }
  };
  
  // Handle when a note is marked as finished
  const handleFinishStudying = (completionData) => {
    console.log('Note completed:', { noteId, ...completionData });
    
    // Extract subject from note title if possible
    let subject = 'Uncategorized';
    if (safeNoteTitle) {
      // First, check for specific formats we know exist in the app
      if (safeNoteTitle.includes('Biology 12') || safeNoteTitle.toLowerCase().includes('biology')) {
        subject = 'Biology';
      } else {
        // Check for common subject patterns in the title
        const subjectMatches = [
          // Match patterns like "Biology 12" or "Math 10" at the beginning
          /^(Biology|Chemistry|Physics|Mathematics|Math|English|History|Geography|Computer Science|Economics)(?:\s*\d*)/i,
          // Or match patterns like "Chapter 5 - Biology" after a dash or colon
          /[-:]\s*(Biology|Chemistry|Physics|Mathematics|Math|English|History|Geography|Computer Science|Economics)/i,
          // Or match subject in parentheses like "(Biology)"
          /\(?(Biology|Chemistry|Physics|Mathematics|Math|English|History|Geography|Computer Science|Economics)\)?/i
        ];
        
        for (const pattern of subjectMatches) {
          const match = safeNoteTitle.match(pattern);
          if (match && match[1]) {
            // Get the main subject (Biology, Math, etc.)
            subject = match[1].trim();
            // Standardize some subjects
            if (subject.toLowerCase() === 'math') subject = 'Mathematics';
            break;
          }
        }
      }
    }
    
    // Get completed notes
    const completedNotes = JSON.parse(localStorage.getItem('completedNotes') || '[]');
    
    // Find the note we just completed
    const existingNoteIndex = completedNotes.findIndex(note => note.id === noteId);
    
    const noteCompletionData = {
      id: noteId,
      completedAt: new Date().toISOString(),
      timeSpent: completionData.timeSpent,
      feedback: completionData.feedback,
      subject: subject
    };
    
    // Update or add the note
    if (existingNoteIndex >= 0) {
      completedNotes[existingNoteIndex] = {
        ...completedNotes[existingNoteIndex],
        ...noteCompletionData
      };
    } else {
      completedNotes.push(noteCompletionData);
    }
    
    localStorage.setItem('completedNotes', JSON.stringify(completedNotes));
    
    // Show success notification
    alert('Study session completed successfully!');
  };
  
  // Render the PDF content with the appropriate fallbacks
  const renderPDFContent = () => {
    if (pdfError) {
      return (
        <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/30">
          <div className="text-center p-6 max-w-md">
            <FaExclamationTriangle className="text-red-500 dark:text-red-400 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">PDF Loading Error</h3>
            <p className="text-red-600 dark:text-red-200 mb-4">{ensureString(pdfError)}</p>
            <button
              onClick={() => navigate('/my-notes')}
              className="px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
              Back to Notes
            </button>
          </div>
        </div>
      );
    }
    
    if (!validNoteUrl) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-slate-800">
          <div className="text-center p-6 max-w-md">
            <FaExclamationTriangle className="text-yellow-500 dark:text-yellow-400 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Document Available</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No PDF URL provided or the document is invalid.
            </p>
            <button
              onClick={() => navigate('/my-notes')}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              Back to Notes
            </button>
          </div>
        </div>
      );
    }
    
    const safeUrl = getSafeUrl();
    
    return (
      <div className="relative w-full h-full">
        {!pdfLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-slate-800 z-10">
            <div className="text-center">
              <FaFilePdf className="text-blue-500 dark:text-blue-400 text-5xl mx-auto animate-pulse mb-4" />
              <p className="text-gray-600 dark:text-gray-300">Loading document...</p>
            </div>
          </div>
        )}
        {safeUrl && (
          <iframe
            ref={iframeRef}
            src={safeUrl}
            className="w-full h-full"
            title={safeNoteTitle}
            loading="lazy"
          />
        )}
      </div>
    );
  };
  
  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-gray-100 dark:bg-slate-900">
        {/* Header with timers */}
        <header className="bg-white dark:bg-slate-800 shadow-md py-3 px-4">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/my-notes')}
                className="p-2 mr-3 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Go back"
              >
                <FaArrowLeft className="text-gray-700 dark:text-gray-300" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 truncate max-w-md">
                {safeNoteTitle}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Finish Studying Button */}
              {noteId && (
                <FinishStudyingButton 
                  noteId={noteId}
                  onFinish={handleFinishStudying}
                  initialStartTime={studyStartTime}
                />
              )}
              
              {/* Session Timer */}
              <div className="flex items-center bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
                <FaClock className="text-primary dark:text-primary-light mr-2" />
                <span className="text-gray-800 dark:text-gray-100 font-mono">
                  {ensureString(formatTime(sessionTime))}
                </span>
                <button 
                  onClick={togglePause}
                  className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded"
                  aria-label={isPaused ? "Resume timer" : "Pause timer"}
                >
                  {isPaused ? (
                    <FaPlay className="text-green-600 dark:text-green-400" />
                  ) : (
                    <FaPause className="text-yellow-600 dark:text-yellow-400" />
                  )}
                </button>
              </div>
              
              {/* Break Timer */}
              <div className="relative">
                {isBreakActive ? (
                  <div className="flex items-center bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-lg">
                    <FaCoffee className="text-blue-600 dark:text-blue-400 mr-2" />
                    <span className="text-blue-800 dark:text-blue-300 font-mono">
                      Break: {ensureString(formatTime(breakTime))}
                    </span>
                    <button
                      onClick={cancelBreak}
                      className="ml-2 p-1 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded"
                      aria-label="Cancel break"
                    >
                      <FaTimes className="text-blue-600 dark:text-blue-400" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowBreakOptions(prev => !prev)}
                      className="flex items-center bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                      aria-label="Start a break"
                    >
                      <FaCoffee className="text-blue-600 dark:text-blue-400 mr-2" />
                      <span className="text-blue-800 dark:text-blue-300">
                        Break Timer
                      </span>
                    </button>
                    
                    {showBreakOptions && (
                      <div
                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg z-10 fade-in"
                      >
                        <div className="p-3 border-b dark:border-slate-700">
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={customTime}
                              onChange={(e) => setCustomTime(e.target.value)}
                              placeholder="Minutes"
                              className="w-full px-3 py-2 rounded-lg mr-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                              min="1"
                            />
                            <button
                              onClick={startCustomBreak}
                              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                              disabled={!customTime || isNaN(customTime) || parseInt(customTime) <= 0}
                            >
                              Set
                            </button>
                          </div>
                        </div>
                        <div className="p-2">
                          <button
                            onClick={startShortBreak}
                            className="w-full text-left px-3 py-2 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg mb-1"
                          >
                            Short Break (10 min)
                          </button>
                          <button
                            onClick={startLongBreak}
                            className="w-full text-left px-3 py-2 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg"
                          >
                            Long Break (30 min)
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden">
          {renderPDFContent()}
        </div>
        
        {/* Break Timer Overlay */}
        {isBreakActive && (
          <div className="fixed inset-0 bg-blue-900/80 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl max-w-md w-full">
              <h2 className="text-2xl font-bold text-center mb-4 text-blue-800 dark:text-blue-300">
                Break Time! 
              </h2>
              <div className="text-center mb-6">
                <span className="text-5xl font-mono text-blue-600 dark:text-blue-400">
                  {ensureString(formatTime(breakTime))}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                Take some time to rest your eyes and stretch. Your notes will be waiting for you when you return.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={cancelBreak}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  End Break Early
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default PDFViewer; 