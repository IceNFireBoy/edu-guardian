import React, { useState, useEffect } from 'react';
import { FaCookieBite, FaCheck, FaCog } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom'; // Use Link for internal navigation
import Button from './Button'; // Use our Button component

const COOKIE_CONSENT_KEY = 'cookie_consent_v1'; // Version key for easier future updates

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    try {
      const hasAccepted = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!hasAccepted) {
        // Delay visibility to avoid layout shift on load
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error('Error accessing localStorage for cookie consent:', error);
      // Decide how to handle localStorage errors - maybe show banner anyway?
      // setIsVisible(true); // Or maybe not, to avoid potential issues
    }
  }, []);

  const acceptCookies = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
      setIsVisible(false);
    } catch (error) {
      console.error('Failed to save cookie consent preference:', error);
      // Still hide the banner visually, even if localStorage fails
      setIsVisible(false); 
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="fixed bottom-0 left-0 right-0 z-[90] p-4 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700"
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-description"
        >
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start md:items-center">
              <FaCookieBite className="text-3xl text-primary dark:text-primary-light mr-4 flex-shrink-0 mt-1 md:mt-0" />
              <div>
                <h3 id="cookie-consent-title" className="font-semibold text-gray-900 dark:text-gray-100">
                  Our Use of Cookies & Local Storage
                </h3>
                <p id="cookie-consent-description" className="text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-3xl">
                  We use essential browser storage (cookies & localStorage) to remember your preferences (like dark mode), enhance site functionality (like note ratings), and improve your overall experience. 
                  {/* Optional: Add link to a privacy policy if available */}
                  {/* <Link to="/privacy-policy" className="underline hover:text-primary">Learn More</Link>. */}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0 mt-3 md:mt-0">
              <Link 
                to="/settings" // Link to settings page for more granular control if implemented
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 underline flex items-center"
              >
                <FaCog className="mr-1" /> Settings
              </Link>
              <Button 
                onClick={acceptCookies}
                className="btn-primary btn-sm flex items-center"
                aria-label="Accept cookies and dismiss banner"
              >
                Accept & Close <FaCheck className="ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent; 