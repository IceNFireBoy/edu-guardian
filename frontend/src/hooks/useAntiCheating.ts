import React, { useState, useEffect, FC } from 'react';
import { FaEye, FaTimes } from 'react-icons/fa';

interface UseAntiCheatingReturn {
  isResting: boolean;
  hiddenWindowCount: number;
  startRestingMode: () => void;
  endRestingMode: () => void;
  RestingModeOverlay: FC; // Type for the component
}

/**
 * Hook for detecting and preventing potential cheating activities
 * (Currently, it primarily offers a manual resting mode)
 */
export const useAntiCheating = (): UseAntiCheatingReturn => {
  const [isResting, setIsResting] = useState<boolean>(false);
  const [hiddenWindowCount, setHiddenWindowCount] = useState<number>(0);

  // Track window visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      // If window is hidden (user switched tabs)
      if (document.hidden) {
        setHiddenWindowCount(prev => prev + 1);
        
        // Log the event but don't actually restrict access
        console.log('[Anti-Cheating] Window hidden event detected');
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Remove event listeners on cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Start resting mode (simulate taking a break)
  const startRestingMode = () => {
    setIsResting(true);
  };

  // End resting mode
  const endRestingMode = () => {
    setIsResting(false);
  };

  // Overlay component that is displayed during resting mode
  const RestingModeOverlay: FC = () => {
    if (!isResting) return null;
    
    return (
      <div className="fixed inset-0 bg-blue-900/90 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
            <FaEye className="text-3xl text-blue-600 dark:text-blue-400" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
            Taking a Break
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You're currently in rest mode. Take a moment to relax your eyes and stretch.
          </p>
          
          <button
            onClick={endRestingMode}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center mx-auto"
          >
            <FaTimes className="mr-2" />
            End Break
          </button>
        </div>
      </div>
    );
  };

  return {
    isResting,
    hiddenWindowCount,
    startRestingMode,
    endRestingMode,
    RestingModeOverlay
  };
};

// Default export is not idiomatic for TS hooks usually, named export is preferred.
// export default useAntiCheating; 