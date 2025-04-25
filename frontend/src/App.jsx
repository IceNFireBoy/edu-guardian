import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { ToastProvider } from './components/ui/Toast';
import toast from 'react-hot-toast';

// Pages
import HomePage from './pages/Home';
import MyNotes from './pages/MyNotes';
import Donate from './pages/Donate';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Leaderboard from './pages/Leaderboard';
import Badges from './pages/Badges';

// Layout components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import CookieConsent from './components/ui/CookieConsent';
import OfflineDetector from './components/ui/OfflineDetector';
import DebugPanel, { debug } from './components/DebugPanel';

// Make debug function available globally (for console usage)
if (typeof window !== 'undefined') {
  window.debug = debug;
}

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Check if localStorage is available
  useEffect(() => {
    const checkStorage = () => {
      try {
        localStorage.setItem('storage_test', 'test');
        localStorage.removeItem('storage_test');
        return true;
      } catch (e) {
        return false;
      }
    };

    if (!checkStorage()) {
      // Show error if localStorage is not available
      setTimeout(() => {
        toast.error(
          'Local storage is not available. Some features may not work properly. Please enable cookies and local storage in your browser settings.',
          { duration: 8000 }
        );
        debug('LocalStorage is not available - features may be limited');
      }, 1000);
    } else {
      debug('App initialized - LocalStorage is available');
    }
  }, []);

  // Initialize dark mode from localStorage on load
  useEffect(() => {
    try {
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      setDarkMode(savedDarkMode);
      
      // Apply dark mode class to html element
      if (savedDarkMode) {
        document.documentElement.classList.add('dark');
        debug('Dark mode activated from saved preference');
      } else {
        document.documentElement.classList.remove('dark');
        debug('Light mode activated from saved preference');
      }
    } catch (error) {
      console.error('Failed to access localStorage for dark mode:', error);
      // Default to light mode if localStorage fails
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    try {
      const newDarkMode = !darkMode;
      setDarkMode(newDarkMode);
      localStorage.setItem('darkMode', newDarkMode.toString());
      debug(`Theme toggled to ${newDarkMode ? 'dark' : 'light'} mode`);
      
      // Toggle dark class on html element for Tailwind dark mode
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Failed to save dark mode preference:', error);
      toast.error('Failed to save your theme preference. Please check your browser settings.');
      
      // Still toggle the UI state
      const newDarkMode = !darkMode;
      setDarkMode(newDarkMode);
      
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <ToastProvider>
      <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-slate-900'}`}>
        <Toaster position="top-right" toastOptions={{
          // Define default options
          className: '',
          duration: 5000,
          style: {
            background: darkMode ? '#1e293b' : '#fff',
            color: darkMode ? '#fff' : '#334155',
          },
          // Default options for specific types
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: 'white',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
            },
          },
        }} />
        <OfflineDetector />
        <Sidebar />
        <div className="flex flex-col min-h-screen md:ml-64">
          <Header toggleDarkMode={toggleDarkMode} />
          <main className="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/my-notes" element={<MyNotes />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/settings" element={<Settings toggleDarkMode={toggleDarkMode} darkMode={darkMode} />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/badges" element={<Badges />} />
            </Routes>
          </main>
        </div>
        <CookieConsent />
        <DebugPanel />
      </div>
    </ToastProvider>
  );
}

export default App;
