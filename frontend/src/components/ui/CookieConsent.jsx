import React, { useState, useEffect } from 'react';
import { FaCookieBite, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem('cookie_consent_accepted');
    
    // Only show banner if user hasn't accepted before
    if (!hasAccepted) {
      // Slight delay to allow page to load first
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    try {
      localStorage.setItem('cookie_consent_accepted', 'true');
      setIsVisible(false);
    } catch (error) {
      console.error('Failed to save cookie consent preference:', error);
      setIsVisible(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-slate-800 shadow-lg border-t border-gray-200 dark:border-slate-700"
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <FaCookieBite className="text-2xl text-primary dark:text-primary-light mr-3" />
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">We use cookies</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
                  This site uses cookies and localStorage to enhance your experience, store your preferences, and support features like dark mode and note ratings.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <a 
                href="/settings" 
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 underline"
              >
                Settings
              </a>
              <button 
                onClick={acceptCookies}
                className="btn btn-primary flex items-center"
              >
                Accept <FaTimes className="ml-2" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;