import React from 'react';
import { motion } from 'framer-motion';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  isInteractive?: boolean;
  onClick?: () => void;
  className?: string;
  fallback?: React.ReactNode;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  size = 'md',
  status,
  isInteractive = false,
  onClick,
  className = '',
  fallback,
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const statusColors = {
    online: 'bg-green-500 dark:bg-green-400',
    offline: 'bg-gray-500 dark:bg-gray-400',
    away: 'bg-yellow-500 dark:bg-yellow-400',
    busy: 'bg-red-500 dark:bg-red-400',
  };

  const baseStyles = `
    relative inline-flex items-center justify-center
    rounded-full overflow-hidden
    bg-gray-200 dark:bg-gray-700
    text-gray-600 dark:text-gray-300
    ${sizes[size]}
    ${isInteractive ? 'cursor-pointer hover:opacity-80' : ''}
  `;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const content = (
    <>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      ) : fallback ? (
        fallback
      ) : (
        <span className="font-medium">{getInitials(alt)}</span>
      )}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0
            w-2.5 h-2.5
            rounded-full border-2 border-white dark:border-gray-800
            ${statusColors[status]}
          `}
        />
      )}
    </>
  );

  if (isInteractive) {
    return (
      <motion.div
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
      </motion.div>
    );
  }

  return (
    <div className={`${baseStyles} ${className}`}>
      {content}
    </div>
  );
};

export default Avatar; 