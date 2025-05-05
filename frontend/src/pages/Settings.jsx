import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaMoon, FaTrash, FaInfoCircle } from 'react-icons/fa';

const SettingsCard = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
    <div className="flex items-center mb-4">
      <span className="mr-3 text-primary dark:text-primary-light">{icon}</span>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
    </div>
    {children}
  </div>
);

const Settings = ({ toggleDarkMode, darkMode }) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  
  // Clear local storage cache
  const clearCache = () => {
    localStorage.clear();
    setClearSuccess(true);
    setShowConfirmClear(false);
    
    // Reset success message after 3 seconds
    setTimeout(() => {
      setClearSuccess(false);
    }, 3000);
  };
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Customize your EduGuardian experience
        </p>
      </div>
      
      {/* Appearance Settings */}
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
            className="bg-gray-200 dark:bg-gray-700 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
          >
            <span
              className={`${
                darkMode ? 'translate-x-6 bg-primary' : 'translate-x-1 bg-white'
              } inline-block h-4 w-4 transform rounded-full transition-transform`}
            />
            <span className="sr-only">Toggle Dark Mode</span>
          </button>
        </div>
      </SettingsCard>
      
      {/* Data Settings */}
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
                className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                Clear Cache
              </button>
            )}
            
            {showConfirmClear && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-900/50"
              >
                <p className="text-red-700 dark:text-red-300 font-medium mb-3">
                  Are you sure? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={clearCache}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Yes, Clear All Data
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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
                className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-green-700 dark:text-green-300"
              >
                Cache cleared successfully.
              </motion.div>
            )}
          </div>
        </div>
      </SettingsCard>
      
      {/* About Section */}
      <SettingsCard title="About EduGuardian" icon={<FaInfoCircle size={20} />}>
        <div className="text-gray-600 dark:text-gray-300">
          <p className="mb-2">
            EduGuardian is a student-powered, secure, and gamified learning platform built to make quality education more accessible, collaborative, and enjoyable. Designed for uploading, organizing, and discovering academic notes, EduGuardian combines smart filtering, progress tracking, and community-driven features to help learners stay motivated and succeed—no matter where they start.
          </p>
          <p className="mt-4">
            Whether you're reviewing for an exam or contributing your own study materials, EduGuardian ensures that learning is always engaging, inclusive, and within reach.
          </p>
        </div>
      </SettingsCard>
    </div>
  );
};

export default Settings; 