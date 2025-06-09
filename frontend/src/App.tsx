import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import Fallback from './components/Fallback';
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
import NetworkStatusMonitor from './components/ui/NetworkStatusMonitor';
import { checkApiHealth } from './api/apiClient';

// Make debug function available globally (for console usage)
if (typeof window !== 'undefined') {
  (window as any).debug = debug;
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

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

  // Check API connectivity on app start
  useEffect(() => {
    checkApiHealth().then(connected => {
      setApiConnected(connected);
      if (!connected) {
        toast.error('Unable to connect to the server. Some features may be unavailable.', {
          duration: 5000,
          id: 'api-connection-initial'
        });
      }
    });
  }, []);

  // If we've encountered a critical error, render the fallback
  if (hasError) {
    console.error('App rendering fallback due to error:', errorMessage);
    return <Fallback />;
  }

  try {
    return (
      <AuthProvider>
        <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-slate-900'}`}>
          <Toaster position="top-right" toastOptions={{
            className: '',
            duration: 5000,
            style: {
              background: darkMode ? '#1e293b' : '#fff',
              color: darkMode ? '#fff' : '#334155',
              border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: darkMode ? '#1e293b' : '#fff',
              },
              style: {
                background: darkMode ? '#064e3b' : '#ecfdf5',
                color: darkMode ? '#d1fae5' : '#065f46',
                border: `1px solid ${darkMode ? '#047857' : '#a7f3d0'}`,
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: darkMode ? '#1e293b' : '#fff',
              },
              style: {
                background: darkMode ? '#7f1d1d' : '#fef2f2',
                color: darkMode ? '#fecaca' : '#991b1b',
                border: `1px solid ${darkMode ? '#b91c1c' : '#fecaca'}`,
              },
            },
            loading: {
              style: {
                background: darkMode ? '#1e293b' : '#fff',
                color: darkMode ? '#fff' : '#334155',
              },
            },
          }} />
          <NetworkStatusMonitor />
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