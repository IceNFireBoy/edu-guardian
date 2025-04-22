import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMoon, FaSun, FaBell } from 'react-icons/fa';
import { useStreak } from '../../hooks/useStreak';

const Header = ({ toggleDarkMode }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const { streak, xp } = useStreak();

  // Motivational quotes
  const quotes = [
    "Education is the passport to the future.",
    "The beautiful thing about learning is nobody can take it away from you.",
    "The more that you read, the more things you will know.",
    "Education is not preparation for life; education is life itself."
  ];
  
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  // Sample notifications
  const sampleNotifications = [
    { id: 1, title: "🎉 You gained 15 XP for uploading notes!", time: "Just now" },
    { id: 2, title: `🔥 You're on a ${streak}-day streak!`, time: "Today" },
    { id: 3, title: "📚 New notes added to Grade 12 > Science!", time: "Yesterday" },
  ];

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <motion.div 
              className="bg-primary/10 px-3 py-1 rounded-full flex items-center mr-4"
              whileHover={{ scale: 1.05 }}
            >
              <span className="font-medium text-primary dark:text-primary-light">Streak: {streak} 🔥</span>
            </motion.div>
            
            <motion.div 
              className="bg-secondary/10 px-3 py-1 rounded-full flex items-center"
              whileHover={{ scale: 1.05 }}
            >
              <span className="font-medium text-secondary dark:text-secondary-light">XP: {xp} ⭐</span>
            </motion.div>
          </div>
          
          <div className="text-gray-700 dark:text-gray-200 italic max-w-md hidden md:block">
            "{randomQuote}"
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative" ref={notificationRef}>
              <button 
                className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <FaBell size={20} />
              </button>
              
              {/* Notification dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-slate-700"
                  >
                    <div className="p-3 border-b border-gray-200 dark:border-slate-700">
                      <h3 className="font-medium text-gray-800 dark:text-gray-100">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {sampleNotifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className="p-3 border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                          <p className="text-gray-800 dark:text-gray-100 text-sm">{notification.title}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{notification.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 text-center">
                      <button className="text-primary dark:text-primary-light text-sm hover:underline">
                        Mark all as read
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button 
              onClick={toggleDarkMode}
              className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light"
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