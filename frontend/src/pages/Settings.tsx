import React, { useState, FC, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FaMoon, FaTrash, FaInfoCircle } from 'react-icons/fa';

interface SettingsCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

const SettingsCard: FC<SettingsCardProps> = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
    <div className="flex items-center mb-4">
      <span className="mr-3 text-primary dark:text-primary-light">{icon}</span>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
    </div>
    {children}
  </div>
);

interface SettingsProps {
  toggleDarkMode: () => void;
  darkMode: boolean;
}

const Settings: FC<SettingsProps> = ({ toggleDarkMode, darkMode }) => {
  const [showConfirmClear, setShowConfirmClear] = useState<boolean>(false);
  const [clearSuccess, setClearSuccess] = useState<boolean>(false);
  
  const clearCache = () => {
    try {
      localStorage.clear();
      setClearSuccess(true);
      setShowConfirmClear(false);
      
      setTimeout(() => {
        setClearSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error clearing local storage:', error);
      // Optionally, show an error toast to the user
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-8" // Added container for better layout
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Customize your EduGuardian experience
        </p>
      </div>
      
      <SettingsCard title="Appearance" icon={<FaMoon size={20} />}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800 dark:text-gray-100">Dark Mode</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Switch between light and dark theme
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="bg-gray-200 dark:bg-gray-700 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light"
            aria-pressed={darkMode}
            aria-label="Toggle Dark Mode"
          >
            <span
              className={`${darkMode ? 'translate-x-6 bg-primary' : 'translate-x-1 bg-white dark:bg-slate-400'} inline-block h-4 w-4 transform rounded-full transition-transform`}
            />
          </button>
        </div>
      </SettingsCard>
      
      <SettingsCard title="Data Management" icon={<FaTrash size={20} />}>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-800 dark:text-gray-100">Clear Local Cache</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
              This will clear all locally stored data including your progress, XP, and streaks.
            </p>
            
            {!showConfirmClear && !clearSuccess && (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="btn btn-danger-outline" // Using a more semantic class if available
              >
                Clear Cache
              </button>
            )}
            
            {showConfirmClear && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700"
              >
                <p className="text-red-700 dark:text-red-300 font-medium mb-3">
                  Are you sure? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={clearCache}
                    className="btn btn-danger"
                  >
                    Yes, Clear All Data
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
            
            {clearSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700"
              >
                Cache cleared successfully.
              </motion.div>
            )}
          </div>
        </div>
      </SettingsCard>
      
      <SettingsCard title="About EduGuardian" icon={<FaInfoCircle size={20} />}>
        <div className="text-gray-600 dark:text-gray-300 prose dark:prose-invert max-w-none">
          <p>
            EduGuardian is a student-powered, secure, and gamified learning platform built to make quality education more accessible, collaborative, and enjoyable. Designed for uploading, organizing, and discovering academic notes, EduGuardian combines smart filtering, progress tracking, and community-driven features to help learners stay motivated and succeed—no matter where they start.
          </p>
          <p className="mt-4">
            Whether you're reviewing for an exam or contributing your own study materials, EduGuardian ensures that learning is always engaging, inclusive, and within reach.
          </p>
        </div>
      </SettingsCard>
    </motion.div>
  );
};

export default Settings; 