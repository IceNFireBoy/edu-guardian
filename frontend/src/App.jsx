import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { ToastProvider } from './components/ui/Toast';

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

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage on load
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    // Apply dark mode class to html element
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    // Toggle dark class on html element for Tailwind dark mode
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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
      </div>
    </ToastProvider>
  );
}

export default App;
