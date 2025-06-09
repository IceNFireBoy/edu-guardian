import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  onClick?: () => void;
  isHoverable?: boolean;
  isInteractive?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  footer,
  header,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  onClick,
  isHoverable = false,
  isInteractive = false,
}) => {
  const baseStyles = `
    rounded-lg border
    bg-white dark:bg-gray-800
    border-gray-200 dark:border-gray-700
    shadow-sm
    ${isInteractive ? 'cursor-pointer' : ''}
    ${isHoverable ? 'transition-shadow hover:shadow-md' : ''}
  `;

  const content = (
    <>
      {(header || title) && (
        <div
          className={`
            px-6 py-4 border-b border-gray-200 dark:border-gray-700
            ${headerClassName}
          `}
        >
          {header || (
            <>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </>
          )}
        </div>
      )}
      <div className={`px-6 py-4 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div
          className={`
            px-6 py-4 border-t border-gray-200 dark:border-gray-700
            ${footerClassName}
          `}
        >
          {footer}
        </div>
      )}
    </>
  );

  if (isInteractive) {
    return (
      <motion.div
        whileHover={isHoverable ? { y: -2 } : undefined}
        whileTap={isInteractive ? { scale: 0.98 } : undefined}
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

export default Card; 