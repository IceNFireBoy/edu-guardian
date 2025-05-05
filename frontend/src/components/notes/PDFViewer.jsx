import React, { useState, useEffect, useRef } from 'react';
import { FaArrowLeft, FaClock, FaCoffee, FaPlay, FaPause, FaTimes, FaExclamationTriangle, FaFilePdf, FaFlag } from 'react-icons/fa';
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

// Detect if device is mobile
const isMobileDevice = () => {
  return (
    typeof window !== 'undefined' && 
    (window.innerWidth <= 768 || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
  );
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
  const [showFeedback, setShowFeedback] = useState(false);
  const [useFallbackViewer, setUseFallbackViewer] = useState(isMobileDevice());
  const [attemptedDirectLoad, setAttemptedDirectLoad] = useState(false);
  
  const sessionTimerRef = useRef(null);
  const breakTimerRef = useRef(null);
  const iframeRef = useRef(null);
  const navigate = useNavigate();
  
  // Validate props - with more thorough validation
  const validNoteUrl = Boolean(noteUrl && typeof noteUrl === 'string' && noteUrl.trim() !== '');
  const safeNoteTitle = ensureString(noteTitle, 'Untitled Note');
  
  // Check device type and orient on mount
  useEffect(() => {
    if (isMobileDevice()) {
      setUseFallbackViewer(true);
      console.log("Mobile device detected - using fallback viewer");
    }
  }, []);
  
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
  
  // When direct loading fails, try the fallback viewer
  useEffect(() => {
    // If we've already tried direct loading and it failed, switch to fallback
    if (attemptedDirectLoad && !pdfLoaded) {
      setUseFallbackViewer(true);
    }
  }, [attemptedDirectLoad, pdfLoaded]);
  
  // Handle direct PDF loading failure after a timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!pdfLoaded) {
        setAttemptedDirectLoad(true);
      }
    }, 3000); // Wait 3 seconds before trying fallback
    
    return () => clearTimeout(timer);
  }, [pdfLoaded]);
  
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
      setAttemptedDirectLoad(true); // Trigger fallback
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
  
  // Calculate time spent in minutes
  const calculateTimeSpent = () => {
    const now = Date.now();
    const timeSpentMs = now - studyStartTime;
    return Math.round(timeSpentMs / (1000 * 60)); // Convert to minutes
  };
  
  // Handle when the Finish Studying button is clicked
  const handleFinishClick = () => {
    setShowFeedback(true);
  };
  
  // Handle when a specific emoji is selected for feedback
  const handleEmojiSelect = (emoji) => {
    const timeSpent = calculateTimeSpent();
    
    // Pass the data to the main handler
    handleFinishStudying({
      noteId,
      timeSpent,
      feedback: emoji,
      subject: 'Auto' // Will be determined in handleFinishStudying
    });
    
    // Hide the feedback dialog
    setShowFeedback(false);
  };
  
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
  
  // Create a safe URL for the iframe with proper PDF.js viewer options
  const getSafeUrl = () => {
    try {
      if (!validNoteUrl) return '';
      
      // Check if URL is valid
      let url = noteUrl;
      
      // Ensure standard URL format
      if (!url.startsWith('http')) {
        url = 'https:' + (url.startsWith('//') ? url : '//' + url);
      }
      
      return url;
    } catch (err) {
      console.error("Error creating safe URL:", err);
      setPdfError("Failed to process PDF URL");
      return '';
    }
  };
  
  // Get a Google Docs viewer URL for the PDF as a fallback
  const getGoogleDocsViewerUrl = () => {
    const url = getSafeUrl();
    if (!url) return '';
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };
  
  // Use PDF.js as a second fallback option for better scrolling
  const getPDFjsViewerUrl = () => {
    const url = getSafeUrl();
    if (!url) return '';
    return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`;
  };
  
  // Get a mobile-optimized PDF URL
  const getMobileOptimizedUrl = () => {
    // First try PDF.js which has good mobile support
    return getPDFjsViewerUrl();
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
    
    // Check if this is a mobile device
    const isMobile = isMobileDevice();
    
    return (
      <div className="w-full h-full relative overflow-hidden">
        {!pdfLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-slate-800 z-10">
            <div className="text-center">
              <FaFilePdf className="text-blue-500 dark:text-blue-400 text-5xl mx-auto animate-pulse mb-4" />
              <p className="text-gray-600 dark:text-gray-300">Loading document...</p>
            </div>
          </div>
        )}
        
        {useFallbackViewer ? (
          // Mobile optimized viewer
          <div className="w-full h-full" style={{ height: 'calc(100vh - 4rem)' }}>
            <iframe 
              src={getMobileOptimizedUrl()}
              className="w-full h-full"
              style={{
                height: '100%',
                width: '100%', 
                border: 'none',
                overflow: 'auto'
              }}
              frameBorder="0"
              scrolling="yes"
              allowFullScreen={true}
              title={`${safeNoteTitle} (Mobile Viewer)`}
            />
          </div>
        ) : (
          // Direct embed for desktop with object tag (better than iframe)
          <object
            data={getSafeUrl()} 
            type="application/pdf"
            className="w-full h-full"
            style={{
              height: 'calc(100vh - 4rem)',
              width: '100%',
              border: 'none',
              overflow: 'auto'
            }}
          >
            {/* Fallback for older browsers */}
            <iframe 
              ref={iframeRef}
              src={getSafeUrl()}
              className="w-full h-full"
              style={{
                height: 'calc(100vh - 4rem)',
                width: '100%',
                border: 'none',
                overflow: 'auto'
              }}
              frameBorder="0"
              scrolling="yes"
              allowFullScreen={true}
              title={safeNoteTitle}
            />
          </object>
        )}
      </div>
    );
  };
  
  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-gray-100 dark:bg-slate-900">
        {/* Compact header */}
        <header className="bg-white dark:bg-slate-800 shadow-md py-2 px-2 sm:px-4 w-full z-10 flex-shrink-0">
          <div className="flex flex-wrap justify-between items-center gap-2 w-full">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/my-notes')}
                className="p-1 sm:p-2 mr-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Go back"
              >
                <FaArrowLeft className="text-gray-700 dark:text-gray-300" />
              </button>
              <h1 className="text-base sm:text-xl font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[200px] sm:max-w-md">
                {safeNoteTitle}
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:space-x-4 mt-1 sm:mt-0">
              {/* Finish Studying Button - with custom mobile styling */}
              {noteId && (
                <div className="hidden sm:block">
                  <FinishStudyingButton 
                    noteId={noteId}
                    onFinish={handleFinishStudying}
                    initialStartTime={studyStartTime}
                  />
                </div>
              )}
              
              {/* Mobile-optimized Finish Studying Button */}
              {noteId && (
                <div className="sm:hidden">
                  <button
                    onClick={handleFinishClick}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded-lg flex items-center transition-colors shadow-sm text-sm"
                  >
                    <FaFlag className="mr-1" />
                    Finish
                  </button>
                  
                  {/* Emoji Feedback Dialog for Mobile */}
                  {showFeedback && (
                    <div className="absolute z-50 top-0 right-0 mt-12 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 w-60 border border-gray-200 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Rate this material
                        </h3>
                        <button 
                          onClick={() => setShowFeedback(false)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          onClick={() => handleEmojiSelect("🤓")}
                          className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <span className="text-xl mb-1">🤓</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">Understood</span>
                        </button>
                        <button
                          onClick={() => handleEmojiSelect("🤔")}
                          className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <span className="text-xl mb-1">🤔</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">Confused</span>
                        </button>
                        <button
                          onClick={() => handleEmojiSelect("❗")}
                          className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <span className="text-xl mb-1">❗</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">Need Help</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Session Timer */}
              <div className="flex items-center bg-gray-100 dark:bg-slate-700 px-2 py-1 sm:px-3 sm:py-2 rounded-lg">
                <FaClock className="text-primary dark:text-primary-light mr-1 sm:mr-2" />
                <span className="text-gray-800 dark:text-gray-100 font-mono text-sm sm:text-base">
                  {ensureString(formatTime(sessionTime))}
                </span>
                <button 
                  onClick={togglePause}
                  className="ml-1 sm:ml-2 p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded"
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
                  <div className="flex items-center bg-blue-100 dark:bg-blue-900/30 px-2 py-1 sm:px-3 sm:py-2 rounded-lg">
                    <FaCoffee className="text-blue-600 dark:text-blue-400 mr-1 sm:mr-2 text-sm sm:text-base" />
                    <span className="text-blue-800 dark:text-blue-300 font-mono text-sm sm:text-base">
                      Break: {ensureString(formatTime(breakTime))}
                    </span>
                    <button
                      onClick={cancelBreak}
                      className="ml-1 sm:ml-2 p-1 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded"
                      aria-label="Cancel break"
                    >
                      <FaTimes className="text-blue-600 dark:text-blue-400" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowBreakOptions(prev => !prev)}
                      className="flex items-center bg-blue-100 dark:bg-blue-900/30 px-2 py-1 sm:px-3 sm:py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                      aria-label="Start a break"
                    >
                      <FaCoffee className="text-blue-600 dark:text-blue-400 mr-1 sm:mr-2" />
                      <span className="text-blue-800 dark:text-blue-300 text-sm sm:text-base">
                        Break
                      </span>
                    </button>
                    
                    {showBreakOptions && (
                      <div
                        className="absolute right-0 mt-2 w-48 sm:w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg z-10 fade-in"
                      >
                        <div className="p-2 sm:p-3 border-b dark:border-slate-700">
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={customTime}
                              onChange={(e) => setCustomTime(e.target.value)}
                              placeholder="Min"
                              className="w-full px-2 py-1 sm:px-3 sm:py-2 rounded-lg mr-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm"
                              min="1"
                            />
                            <button
                              onClick={startCustomBreak}
                              className="px-2 py-1 sm:px-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                              disabled={!customTime || isNaN(customTime) || parseInt(customTime) <= 0}
                            >
                              Set
                            </button>
                          </div>
                        </div>
                        <div className="p-2">
                          <button
                            onClick={startShortBreak}
                            className="w-full text-left px-2 py-1 sm:px-3 sm:py-2 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg mb-1 text-sm"
                          >
                            Short Break (10 min)
                          </button>
                          <button
                            onClick={startLongBreak}
                            className="w-full text-left px-2 py-1 sm:px-3 sm:py-2 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg text-sm"
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
        
        {/* PDF container */}
        <div className="flex-grow w-full">
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