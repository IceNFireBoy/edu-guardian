import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  containerClassName?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
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
    const radioId = props.id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`space-y-1 ${containerClassName}`}>
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <div className="relative">
              <input
                ref={ref}
                type="radio"
                id={radioId}
                className={`
                  sr-only
                  peer
                  ${className}
                `}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={
                  error ? `${radioId}-error` : helperText ? `${radioId}-helper` : undefined
                }
                {...props}
              />
              <div
                className={`
                  w-5 h-5
                  border rounded-full
                  flex items-center justify-center
                  transition-colors
                  ${
                    error
                      ? 'border-red-300 dark:border-red-500 peer-focus:border-red-500 dark:peer-focus:border-red-400'
                      : 'border-gray-300 dark:border-gray-600 peer-focus:border-blue-500 dark:peer-focus:border-blue-400'
                  }
                  ${
                    props.checked
                      ? 'border-blue-600 dark:border-blue-500'
                      : 'bg-white dark:bg-gray-800'
                  }
                  peer-focus:ring-2
                  ${
                    error
                      ? 'peer-focus:ring-red-500 dark:peer-focus:ring-red-400'
                      : 'peer-focus:ring-blue-500 dark:peer-focus:ring-blue-400'
                  }
                  peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
                `}
              >
                {props.checked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-500"
                  />
                )}
              </div>
            </div>
          </div>
          {label && (
            <label
              htmlFor={radioId}
              className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
            id={`${radioId}-error`}
            role="alert"
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p
            className="mt-1 text-sm text-gray-500 dark:text-gray-400"
            id={`${radioId}-helper`}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio; 