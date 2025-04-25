import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWifi, FaExclamationTriangle } from 'react-icons/fa';

const OfflineDetector = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  
  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine);
    
    // Event handlers
    const handleOffline = () => {
      setIsOffline(true);
      try {
        localStorage.setItem('was_offline', 'true');
      } catch (error) {
        console.error('Failed to save offline state:', error);
      }
    };
    
    const handleOnline = () => {
      if (isOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
      setIsOffline(false);
    };
    
    // Add event listeners
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [isOffline]);
  
  return (
    <>
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white py-2 px-4"
          >
            <div className="flex items-center justify-center">
              <FaExclamationTriangle className="mr-2" />
              <span>
                You are currently offline. Some features may not work properly.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showReconnected && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white py-2 px-4"
          >
            <div className="flex items-center justify-center">
              <FaWifi className="mr-2" />
              <span>
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