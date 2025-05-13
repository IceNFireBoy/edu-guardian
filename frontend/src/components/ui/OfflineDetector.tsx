import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWifi, FaExclamationTriangle } from 'react-icons/fa';

const OfflineDetector: React.FC = () => {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  
  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false); // Hide reconnected message if we go offline again
      try {
        localStorage.setItem('was_offline', 'true');
      } catch (error) {
        console.error('Failed to save offline state:', error);
      }
    };
    
    const handleOnline = () => {
      // Only show reconnected message if we were previously offline
      if (isOffline) {
        setShowReconnected(true);
        // Hide message after a delay
        const timer = setTimeout(() => setShowReconnected(false), 3000);
        // Ensure timer is cleared if component unmounts or state changes rapidly
        // Although handled by the main cleanup, explicit clearing here is safer
        return () => clearTimeout(timer);
      }
      setIsOffline(false);
    };
    
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    // Check state again in case it changed between initial render and effect setup
    setIsOffline(!navigator.onLine);

    // Clean up listeners on unmount
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [isOffline]); // Re-run effect if isOffline state changes (e.g., by handleOnline)
  
  return (
    <>
      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white py-3 px-4 shadow-lg"
            role="alert"
          >
            <div className="container mx-auto flex items-center justify-center">
              <FaExclamationTriangle className="mr-2 text-lg" />
              <span className="text-sm font-medium">
                You are currently offline. Some features may be unavailable.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Reconnected Banner */}
      <AnimatePresence>
        {showReconnected && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-green-600 text-white py-3 px-4 shadow-lg"
            role="status"
          >
            <div className="container mx-auto flex items-center justify-center">
              <FaWifi className="mr-2 text-lg" />
              <span className="text-sm font-medium">
                You are back online!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OfflineDetector; 