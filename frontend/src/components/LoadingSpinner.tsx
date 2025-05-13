import React from 'react';
import { motion } from 'framer-motion';

// Define allowed sizes and colors as types
type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
type SpinnerColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'gray';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'primary' }) => {
  // Use Record for type safety
  const sizeMap: Record<SpinnerSize, string> = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  const colorMap: Record<SpinnerColor, string> = {
    primary: 'border-blue-500 border-t-transparent',
    secondary: 'border-purple-500 border-t-transparent',
    success: 'border-green-500 border-t-transparent',
    danger: 'border-red-500 border-t-transparent',
    warning: 'border-yellow-500 border-t-transparent',
    gray: 'border-gray-500 border-t-transparent'
  };
  
  return (
    <motion.div
      className={`rounded-full border-2 ${colorMap[color]} ${sizeMap[size]}`}
      animate={{ rotate: 360 }}
      transition={{ 
        duration: 1, 
        repeat: Infinity, 
        ease: "linear"
      }}
      role="status"
      aria-label="Loading"
    />
  );
};

export default LoadingSpinner; 