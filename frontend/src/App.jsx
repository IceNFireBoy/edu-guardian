import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';

// Pages
import HomePage from './pages/Home';
import MyNotes from './pages/MyNotes';
import Donate from './pages/Donate';
import Progress from './pages/Progress';
import Settings from './pages/Settings';

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
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 overflow-auto" style={{ height: '100vh' }}>
          <Header toggleDarkMode={toggleDarkMode} />
          <main className="container mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/my-notes" element={<MyNotes />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/settings" element={<Settings toggleDarkMode={toggleDarkMode} darkMode={darkMode} />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
