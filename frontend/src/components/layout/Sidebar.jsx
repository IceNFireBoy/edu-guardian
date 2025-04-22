import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaBook, FaUpload, FaChartLine, FaCog, FaBars, FaTimes, FaTrophy } from 'react-icons/fa';

const Sidebar = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isOpen, setIsOpen] = useState(!isMobile);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsOpen(!mobile); // Auto-close on mobile, auto-open on desktop
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Menu items
  const menuItems = [
    { path: '/', icon: <FaHome size={20} />, label: 'Dashboard' },
    { path: '/my-notes', icon: <FaBook size={20} />, label: 'My Notes' },
    { path: '/donate', icon: <FaUpload size={20} />, label: 'Upload Notes' },
    { path: '/leaderboard', icon: <FaTrophy size={20} />, label: 'Leaderboard' },
    { path: '/progress', icon: <FaChartLine size={20} />, label: 'Progress' },
    { path: '/settings', icon: <FaCog size={20} />, label: 'Settings' }
  ];
  
  // Mobile hamburger toggle
  const toggleSidebar = () => setIsOpen(!isOpen);
  
  return (
    <>
      {/* Mobile hamburger button */}
      {isMobile && (
        <button 
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md text-gray-800 dark:text-gray-100"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          role="switch"
        >
          {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      )}
      
      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={isMobile ? { x: -280 } : { x: 0 }}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -280 } : { x: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 shadow-lg z-40"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h1 className="text-xl font-bold text-primary dark:text-primary-light">
                EduGuardian
              </h1>
              {isMobile && (
                <button 
                  onClick={toggleSidebar}
                  className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light"
                  aria-label="Close menu"
                >
                  <FaTimes size={20} />
                </button>
              )}
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                {menuItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center p-2 rounded-lg transition-colors ${
                        location.pathname === item.path
                          ? 'bg-primary/10 text-primary dark:text-primary-light'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                      onClick={isMobile ? toggleSidebar : undefined}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Content spacer to push main content when sidebar is visible on desktop */}
      {!isMobile && <div className="w-64" aria-hidden="true" />}
    </>
  );
};

export default Sidebar; 