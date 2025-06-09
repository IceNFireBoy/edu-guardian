import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      containerClassName = '',
      ...props
    },
    ref
  ) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`space-y-1 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-400 dark:text-gray-500">{leftIcon}</span>
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              block w-full rounded-md border
              ${error
                ? 'border-red-300 dark:border-red-500 focus:border-red-500 dark:focus:border-red-400'
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400'
              }
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              ${leftIcon ? 'pl-10' : 'pl-4'}
              ${rightIcon ? 'pr-10' : 'pr-4'}
              py-2 text-sm
              focus:outline-none focus:ring-2
              ${error
                ? 'focus:ring-red-500 dark:focus:ring-red-400'
                : 'focus:ring-blue-500 dark:focus:ring-blue-400'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-400 dark:text-gray-500">{rightIcon}</span>
            </div>
          )}
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
            id={`${inputId}-error`}
            role="alert"
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p
            className="mt-1 text-sm text-gray-500 dark:text-gray-400"
            id={`${inputId}-helper`}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 