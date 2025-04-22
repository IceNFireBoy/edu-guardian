import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';

// Pages
import HomePage from './pages/Home';
import MyNotes from './pages/MyNotes';
import Donate from './pages/Donate';

// Layout components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Header toggleDarkMode={() => setDarkMode(!darkMode)} />
          <main className="container mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/my-notes" element={<MyNotes />} />
              <Route path="/donate" element={<Donate />} />
              {/* Additional routes will be added here */}
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
