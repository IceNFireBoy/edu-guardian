import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  containerClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      className = '',
      containerClassName = '',
      ...props
    },
    ref
  ) => {
    const textareaId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`space-y-1 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            className={`
              block w-full rounded-md border
              ${error
                ? 'border-red-300 dark:border-red-500 focus:border-red-500 dark:focus:border-red-400'
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400'
              }
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              px-4 py-2 text-sm
              focus:outline-none focus:ring-2
              ${error
                ? 'focus:ring-red-500 dark:focus:ring-red-400'
                : 'focus:ring-blue-500 dark:focus:ring-blue-400'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              resize-none
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
            }
            {...props}
          />
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
            id={`${textareaId}-error`}
            role="alert"
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p
            className="mt-1 text-sm text-gray-500 dark:text-gray-400"
            id={`${textareaId}-helper`}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea; 