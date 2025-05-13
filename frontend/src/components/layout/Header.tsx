import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMoon, FaSun, FaBell, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { useStreak } from '../../hooks/useStreak';
import { useAuthContext } from '../../features/auth/AuthContext';
import { Link } from 'react-router-dom';

interface Notification {
  id: number;
  title: string;
  time: string;
  read: boolean;
}

interface HeaderProps {
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleDarkMode }) => {
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { streak: streakData, recordActivity } = useStreak();
  const { isAuthenticated, user } = useAuthContext();
  
  const currentStreak = streakData?.currentStreak || 0;
  const xp = streakData?.xp || 0;
  const lastVisit = streakData?.lastVisit;

  // Motivational quotes
  const quotes = [
    "Education is the passport to the future.",
    "The beautiful thing about learning is nobody can take it away from you.",
    "The more that you read, the more things you will know.",
    "Education is not preparation for life; education is life itself."
  ];
  
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  // Sample notifications (using current streak)
  const sampleNotifications: Notification[] = [
    { id: 1, title: "🎉 You gained 15 XP for uploading notes!", time: "Just now", read: false },
    { id: 2, title: `🔥 You're on a ${currentStreak}-day streak!`, time: "Today", read: false },
    { id: 3, title: "📚 New notes added to Grade 12 > Science!", time: "Yesterday", read: true },
    { id: 4, title: "⭐ You've earned the 'Note Scholar' badge!", time: "2 days ago", read: true },
  ];

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    // In a real app, this would update a database
    // For now, we'll just close the dropdown
    setShowNotifications(false);
  };
  
  // Count unread notifications
  const unreadCount = sampleNotifications.filter(n => !n.read).length;

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {isAuthenticated ? (
              <>
                <motion.div 
                  className="bg-primary/10 px-3 py-1 rounded-full flex items-center mr-4"
                  whileHover={{ scale: 1.05 }}
                  aria-label={`Current streak: ${currentStreak} days`}
                >
                  <span className="font-medium text-primary dark:text-primary-light">Streak: {currentStreak} 🔥</span>
                </motion.div>
                
                <motion.div 
                  className="bg-secondary/10 px-3 py-1 rounded-full flex items-center"
                  whileHover={{ scale: 1.05 }}
                  aria-label={`Experience points: ${xp}`}
                >
                  <span className="font-medium text-secondary dark:text-secondary-light">XP: {xp} ⭐</span>
                </motion.div>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link 
                  to="/login" 
                  className="bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-full flex items-center"
                >
                  <FaSignInAlt className="mr-1 text-primary dark:text-primary-light" />
                  <span className="font-medium text-primary dark:text-primary-light">Login</span>
                </Link>
                <Link 
                  to="/register" 
                  className="bg-secondary/10 hover:bg-secondary/20 px-3 py-1 rounded-full flex items-center"
                >
                  <FaUserPlus className="mr-1 text-secondary dark:text-secondary-light" />
                  <span className="font-medium text-secondary dark:text-secondary-light">Register</span>
                </Link>
              </div>
            )}
          </div>
          
          <div className="text-gray-700 dark:text-gray-200 italic max-w-md hidden md:block">
            "{randomQuote}"
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <div className="relative" ref={notificationRef}>
                <button 
                  className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                  aria-haspopup="true"
                >
                  <FaBell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notification dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-slate-700"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="notification-menu"
                    >
                      <div className="p-3 border-b border-gray-200 dark:border-slate-700">
                        <h3 className="font-medium text-gray-800 dark:text-gray-100">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {sampleNotifications.length > 0 ? (
                          sampleNotifications.map(notification => (
                            <div 
                              key={notification.id} 
                              className={`p-3 border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 ${
                                notification.read ? '' : 'bg-blue-50 dark:bg-blue-900/20'
                              }`}
                            >
                              <p className="text-gray-800 dark:text-gray-100 text-sm">{notification.title}</p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{notification.time}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                            No notifications yet
                          </div>
                        )}
                      </div>
                      <div className="p-3 text-center">
                        <button 
                          className="text-primary dark:text-primary-light text-sm hover:underline"
                          onClick={markAllAsRead}
                          aria-label="Mark all notifications as read"
                        >
                          Mark all as read
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            <button 
              onClick={toggleDarkMode}
              className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light"
              aria-label="Toggle dark mode"
              role="switch"
              aria-checked={document.documentElement.classList.contains('dark')}
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