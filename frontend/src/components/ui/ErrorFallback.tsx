import React from 'react';
import { ErrorType } from '../../utils/errorHandler';

interface ErrorFallbackProps {
  errorType?: ErrorType;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  errorType = ErrorType.UNKNOWN,
  message,
  onRetry,
  className = ''
}) => {
  let defaultMessage = 'Something went wrong.';
  let buttonText = 'Try Again';
  let icon = '⚠️';

  switch (errorType) {
    case ErrorType.NETWORK:
      defaultMessage = 'Unable to connect to the server. Please check your internet connection.';
      icon = '📶';
      break;
    case ErrorType.AUTHENTICATION:
      defaultMessage = 'You need to log in to access this content.';
      buttonText = 'Log In';
      icon = '🔐';
      break;
    case ErrorType.VALIDATION:
      defaultMessage = 'There was a problem with the request.';
      icon = '📋';
      break;
    case ErrorType.SERVER:
      defaultMessage = 'Server error. Our team has been notified.';
      icon = '🔧';
      break;
    default:
      defaultMessage = 'An error occurred while loading content.';
      icon = '⚠️';
  }

  const displayMessage = message || defaultMessage;

  return (
    <div className={`p-4 rounded-md bg-red-50 text-red-700 ${className}`}>
      <div className="flex flex-col items-center text-center gap-3 py-6">
        <span className="text-4xl">{icon}</span>
        <h3 className="text-xl font-semibold">{displayMessage}</h3>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorFallback; 