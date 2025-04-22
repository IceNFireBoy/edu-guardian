import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Hook for detecting and preventing potential cheating activities
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.restingTime - Time in ms to show resting mode (default: 5000)
 * @param {boolean} options.enableLogging - Whether to send logs to server (default: true)
 * @returns {Object} Anti-cheating state and components
 */
export const useAntiCheating = (options = {}) => {
  const { 
    restingTime = 5000, 
    enableLogging = true 
  } = options;
  
  const [isResting, setIsResting] = useState(false);
  const [eventLogs, setEventLogs] = useState([]);
  const [quote, setQuote] = useState("");
  
  const motivationalQuotes = [
    "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and love of what you are doing.",
    "The beautiful thing about learning is that no one can take it away from you.",
    "Education is the most powerful weapon which you can use to change the world.",
    "The roots of education are bitter, but the fruit is sweet.",
    "Your education is a dress rehearsal for a life that is yours to lead."
  ];
  
  // Enter resting mode
  const enterRestingMode = useCallback(() => {
    // Get random motivational quote
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setQuote(randomQuote);
    
    // Set resting state
    setIsResting(true);
    
    // Automatically exit resting mode after specified time
    setTimeout(() => {
      setIsResting(false);
    }, restingTime);
  }, [restingTime, motivationalQuotes]);
  
  // Log suspicious activity
  const logSuspiciousActivity = useCallback((eventType) => {
    const logEntry = {
      eventType,
      timestamp: new Date().toISOString()
    };
    
    setEventLogs(prev => [...prev, logEntry]);
    
    if (enableLogging) {
      // Log to server (would be implemented with actual API)
      console.log("Logging suspicious activity:", logEntry);
      
      // In a real implementation, we would send this to an API
      /*
      fetch('/api/logActivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });
      */
    }
    
    // Enter resting mode upon suspicious activity
    enterRestingMode();
  }, [enterRestingMode, enableLogging]);
  
  useEffect(() => {
    // Handler for visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logSuspiciousActivity('visibilitychange');
      }
    };
    
    // Handler for developer tools detection
    const handleDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        logSuspiciousActivity('devtools_open');
      }
    };
    
    // Handler for copy detection
    const handleCopy = (e) => {
      logSuspiciousActivity('copy_attempt');
      
      // Optionally prevent copying
      // e.preventDefault();
    };
    
    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    window.addEventListener('resize', handleDevTools);
    
    // Check for fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        logSuspiciousActivity('exit_fullscreen');
      }
    });
    
    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      window.removeEventListener('resize', handleDevTools);
      document.removeEventListener('fullscreenchange', () => {});
    };
  }, [logSuspiciousActivity]);
  
  // Resting mode overlay component
  const RestingModeOverlay = () => (
    <AnimatePresence>
      {isResting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900 bg-opacity-90 z-50 flex flex-col items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg max-w-md text-center"
          >
            <h2 className="text-2xl font-bold text-primary mb-4">Resting Mode Activated</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{quote}</p>
            
            <motion.div
              animate={{ 
                rotate: [0, 360],
                borderRadius: ["20%", "50%", "20%"] 
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-16 h-16 bg-primary mx-auto mb-6"
            />
            
            <p className="text-sm text-gray-500">
              Take a moment to rest. Learning is a marathon, not a sprint.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  
  return {
    isResting,
    eventLogs,
    enterRestingMode,
    RestingModeOverlay
  };
};

export default useAntiCheating;