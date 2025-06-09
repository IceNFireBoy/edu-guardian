import React from 'react';
import { motion } from 'framer-motion';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  isInteractive?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  isInteractive = false,
  onClick,
  className = '',
  icon,
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  const baseStyles = `
    inline-flex items-center font-medium rounded-full
    ${variants[variant]}
    ${sizes[size]}
    ${isInteractive ? 'cursor-pointer hover:opacity-80' : ''}
  `;

  const content = (
    <>
      {icon && (
        <span className="mr-1.5" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </>
  );

  if (isInteractive) {
    return (
      <motion.span
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`${baseStyles} ${className}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        {content}
      </motion.span>
    );
  }

  return (
    <span className={`${baseStyles} ${className}`}>
      {content}
    </span>
  );
};

export default Badge; 