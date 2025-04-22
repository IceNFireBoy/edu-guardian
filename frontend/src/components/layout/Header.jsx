import React from 'react';
import { motion } from 'framer-motion';
import { FaMoon, FaSun, FaBell } from 'react-icons/fa';
import { useStreak } from '../../hooks/useStreak';

const Header = ({ toggleDarkMode }) => {
  // We'll implement this hook later
  const { streak, xp } = useStreak();

  // Motivational quotes
  const quotes = [
    "Education is the passport to the future.",
    "The beautiful thing about learning is nobody can take it away from you.",
    "The more that you read, the more things you will know.",
    "Education is not preparation for life; education is life itself."
  ];
  
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <motion.div 
              className="bg-primary/10 px-3 py-1 rounded-full flex items-center mr-4"
              whileHover={{ scale: 1.05 }}
            >
              <span className="font-medium text-primary">Streak: {streak} 🔥</span>
            </motion.div>
            
            <motion.div 
              className="bg-secondary/10 px-3 py-1 rounded-full flex items-center"
              whileHover={{ scale: 1.05 }}
            >
              <span className="font-medium text-secondary">XP: {xp} ⭐</span>
            </motion.div>
          </div>
          
          <div className="text-gray-600 dark:text-gray-300 italic max-w-md hidden md:block">
            "{randomQuote}"
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary">
              <FaBell size={20} />
            </button>
            <button 
              onClick={toggleDarkMode}
              className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
            >
              <motion.div 
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <FaMoon size={20} className="dark:hidden" />
                <FaSun size={20} className="hidden dark:block" />
              </motion.div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 