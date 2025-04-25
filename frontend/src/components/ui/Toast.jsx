import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

// Create Context for Toast
const ToastContext = createContext(null);

// Toast Types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
};

// Toast Component
const Toast = ({ id, message, type, duration = 5000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  // Styles based on toast type
  const getToastStyles = () => {
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return {
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-800 dark:text-green-200',
          icon: <FaCheckCircle className="text-green-500 dark:text-green-400" />,
        };
      case TOAST_TYPES.ERROR:
        return {
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-800 dark:text-red-200',
          icon: <FaExclamationTriangle className="text-red-500 dark:text-red-400" />,
        };
      case TOAST_TYPES.INFO:
      default:
        return {
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-800 dark:text-blue-200',
          icon: <FaInfoCircle className="text-blue-500 dark:text-blue-400" />,
        };
    }
  };

  const { bgColor, textColor, icon } = getToastStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.5 }}
      className={`${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-md mb-3 flex items-center max-w-md w-full`}
      role="alert"
    >
      <div className="mr-3 text-xl">{icon}</div>
      <div className="flex-1 mr-2">{message}</div>
      <button
        onClick={() => onClose(id)}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
        aria-label="Close"
      >
        <FaTimes />
      </button>
    </motion.div>
  );
};

// ToastProvider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = TOAST_TYPES.INFO, duration = 5000) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50">
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={removeToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

// Custom hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return {
    showToast: context.addToast,
    success: (message, duration) => context.addToast(message, TOAST_TYPES.SUCCESS, duration),
    error: (message, duration) => context.addToast(message, TOAST_TYPES.ERROR, duration),
    info: (message, duration) => context.addToast(message, TOAST_TYPES.INFO, duration),
    removeToast: context.removeToast,
  };
}; 