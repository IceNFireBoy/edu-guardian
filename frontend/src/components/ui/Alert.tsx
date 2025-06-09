import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaTimes } from 'react-icons/fa';

interface AlertProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
  className?: string;
  isDismissible?: boolean;
  icon?: React.ReactNode;
}

const Alert: React.FC<AlertProps> = ({
  title,
  children,
  variant = 'info',
  onClose,
  className = '',
  isDismissible = false,
  icon,
}) => {
  const variants = {
    info: {
      container: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      icon: 'text-blue-500 dark:text-blue-400',
      title: 'text-blue-800 dark:text-blue-200',
      text: 'text-blue-700 dark:text-blue-300',
    },
    success: {
      container: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
      icon: 'text-green-500 dark:text-green-400',
      title: 'text-green-800 dark:text-green-200',
      text: 'text-green-700 dark:text-green-300',
    },
    warning: {
      container: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-500 dark:text-yellow-400',
      title: 'text-yellow-800 dark:text-yellow-200',
      text: 'text-yellow-700 dark:text-yellow-300',
    },
    error: {
      container: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
      icon: 'text-red-500 dark:text-red-400',
      title: 'text-red-800 dark:text-red-200',
      text: 'text-red-700 dark:text-red-300',
    },
  };

  const defaultIcons = {
    info: <FaInfoCircle className="w-5 h-5" />,
    success: <FaCheckCircle className="w-5 h-5" />,
    warning: <FaExclamationTriangle className="w-5 h-5" />,
    error: <FaTimesCircle className="w-5 h-5" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        rounded-lg border p-4
        ${variants[variant].container}
        ${className}
      `}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <span className={variants[variant].icon} aria-hidden="true">
            {icon || defaultIcons[variant]}
          </span>
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${variants[variant].title}`}>
              {title}
            </h3>
          )}
          <div className={`mt-2 text-sm ${variants[variant].text}`}>
            {children}
          </div>
        </div>
        {isDismissible && onClose && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              className={`
                inline-flex rounded-md
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${variants[variant].icon}
                hover:opacity-75
              `}
              onClick={onClose}
              aria-label="Close"
            >
              <FaTimes className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Alert; 