import React from 'react';
import { motion } from 'framer-motion';

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  showValue?: boolean;
  isIndeterminate?: boolean;
  className?: string;
  label?: string;
}

const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  isIndeterminate = false,
  className = '',
  label,
}) => {
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variants = {
    default: 'bg-blue-600 dark:bg-blue-500',
    success: 'bg-green-600 dark:bg-green-500',
    warning: 'bg-yellow-600 dark:bg-yellow-500',
    error: 'bg-red-600 dark:bg-red-500',
    info: 'bg-blue-400 dark:bg-blue-300',
  };

  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`space-y-1 ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`
          relative w-full overflow-hidden
          rounded-full
          bg-gray-200 dark:bg-gray-700
          ${sizes[size]}
        `}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      >
        {isIndeterminate ? (
          <motion.div
            className={`absolute inset-0 ${variants[variant]}`}
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: 'linear',
            }}
          />
        ) : (
          <motion.div
            className={`absolute inset-y-0 left-0 ${variants[variant]}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        )}
      </div>
    </div>
  );
};

export default Progress; 