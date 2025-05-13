import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { ToastProvider } from './components/ui/Toast';
import toast from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import Fallback from './components/Fallback';
import Navigation from './components/Navigation';
import { AuthProvider } from './features/auth/AuthContext';
import PrivateRoute from './features/auth/PrivateRoute';
import Login from './features/auth/Login';
import Register from './features/auth/Register';

// Pages
import HomePage from './pages/Home';
import MyNotes from './pages/MyNotes';
import Donate from './pages/Donate';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Badges from './pages/Badges';
import NoteViewer from './pages/NoteViewer';
import TestPDFDebug from './debug/TestPDFDebug';
import NoteFilterPage from './features/notes/NoteFilterPage';
import NoteUploader from './features/notes/NoteUploader';
import StudyPage from './pages/StudyPage/StudyPage';
import ProfilePage from './features/user/ProfilePage';

// Layout components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import CookieConsent from './components/ui/CookieConsent';
import OfflineDetector from './components/ui/OfflineDetector';
import DebugPanel, { debug } from './components/DebugPanel';

// Make debug function available globally (for console usage)
if (typeof window !== 'undefined') {
  (window as any).debug = debug;
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if localStorage is available
  useEffect(() => {
    try {
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
    } catch (error) {
      console.error('Error in localStorage check:', error);
      debug('Error checking localStorage:', (error as Error).message);
      // Don't set hasError here - we can continue without localStorage
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

  // If we've encountered a critical error, render the fallback
  if (hasError) {
    console.error('App rendering fallback due to error:', errorMessage);
    return <Fallback />;
  }

  try {
    return (
      <AuthProvider>
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
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Protected routes */}
                    <Route element={<PrivateRoute />}>
                      <Route path="/my-notes" element={<MyNotes />} />
                      <Route path="/donate" element={<Donate />} />
                      <Route path="/progress" element={<Progress />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/settings" element={<Settings toggleDarkMode={toggleDarkMode} darkMode={darkMode} />} />
                      <Route path="/badges" element={<Badges />} />
                      <Route path="/view-note" element={<NoteViewer />} />
                      <Route path="/view-note/:noteId" element={<NoteViewer />} />
                      <Route path="/notes" element={<NoteFilterPage />} />
                      <Route path="/notes/upload" element={<NoteUploader />} />
                      <Route path="/study/:noteId" element={<StudyPage />} />
                    </Route>
                    
                    {/* Debug routes */}
                    <Route path="/debug/test-pdf/*" element={<TestPDFDebug />} />
                  </Routes>
                </ErrorBoundary>
              </main>
            </div>
            <CookieConsent />
            <DebugPanel />
          </div>
        </ToastProvider>
      </AuthProvider>
    );
  } catch (error) {
    console.error('Critical error in App render:', error);
    setHasError(true);
    setErrorMessage((error as Error).message);
    return <Fallback />;
  }
}

export default App; 