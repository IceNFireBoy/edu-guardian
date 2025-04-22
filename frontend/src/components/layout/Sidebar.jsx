import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaHome, 
  FaBook, 
  FaUpload, 
  FaCog, 
  FaChartLine 
} from 'react-icons/fa';

const Sidebar = () => {
  const navItems = [
    { to: '/', icon: <FaHome />, label: 'Home' },
    { to: '/my-notes', icon: <FaBook />, label: 'My Notes' },
    { to: '/donate', icon: <FaUpload />, label: 'Donate' },
    { to: '/progress', icon: <FaChartLine />, label: 'Progress' },
    { to: '/settings', icon: <FaCog />, label: 'Settings' },
  ];

  return (
    <motion.aside 
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="w-64 h-screen bg-white shadow-md dark:bg-slate-800 border-r dark:border-slate-700"
    >
      <div className="p-4">
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-bold text-primary"
        >
          EduGuardian 🎓
        </motion.h1>
      </div>
      <nav className="mt-6">
        <ul>
          {navItems.map((item) => (
            <li key={item.to} className="mb-2">
              <NavLink 
                to={item.to}
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 
                  ${isActive ? 'bg-primary/10 border-r-4 border-primary' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`
                }
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </motion.aside>
  );
};

export default Sidebar; 