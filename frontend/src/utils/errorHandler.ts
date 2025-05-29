import { toast } from 'react-hot-toast';

// Error types for better handling
export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

interface ErrorHandlerOptions {
  showToast?: boolean;
  customMessage?: string;
  retry?: () => Promise<any>;
}

/**
 * Centralized error handler for API requests
 * @param error - The error object
 * @param options - Options for error handling
 * @returns The error object with additional context
 */
export const handleApiError = (
  error: any,
  options: ErrorHandlerOptions = { showToast: true }
): { message: string; type: ErrorType } => {
  // Default error message and type
  let message = 'An unexpected error occurred';
  let type = ErrorType.UNKNOWN;

  // Override with custom message if provided
  if (options.customMessage) {
    message = options.customMessage;
  } 
  // Network error (no response)
  else if (error.message === 'No response from server. Please check your connection.') {
    message = 'Unable to connect to the server. Please check your internet connection.';
    type = ErrorType.NETWORK;
  }
  // Response with error status
  else if (error.response) {
    const { status } = error.response;
    
    // Authentication errors
    if (status === 401 || status === 403) {
      message = status === 401 
        ? 'Your session has expired. Please log in again.' 
        : 'You do not have permission to access this resource.';
      type = ErrorType.AUTHENTICATION;
    }
    // Validation errors
    else if (status === 400 || status === 422) {
      message = error.response.data?.message || 'Please check your input and try again.';
      type = ErrorType.VALIDATION;
    }
    // Server errors
    else if (status >= 500) {
      message = 'Server error. Please try again later.';
      type = ErrorType.SERVER;
    }
  }
  // Use error message if available
  else if (error.message) {
    message = error.message;
  }

  // Show toast notification if requested
  if (options.showToast) {
    toast.error(message, {
      id: `error-${type}`,
      duration: 5000
    });
  }

  // Log error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('API Error:', error);
  }

  return { message, type };
};

/**
 * Retry a failed API call with exponential backoff
 * @param fn - The function to retry
 * @param retries - Number of retries (default: 3)
 * @param delay - Initial delay in ms (default: 1000)
 * @param backoff - Backoff factor (default: 2)
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>, 
  retries = 3, 
  delay = 1000, 
  backoff = 2
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    // Show toast for retry
    toast.loading(`Retrying connection... (${retries} ${retries === 1 ? 'attempt' : 'attempts'} left)`, { 
      id: 'retry-toast',
      duration: delay
    });
    
    // Wait for the delay duration
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with reduced count and increased delay
    return retryWithBackoff(fn, retries - 1, delay * backoff, backoff);
  }
};

/**
 * Fallback content for when data fails to load
 * @param errorType - Type of error
 * @param retryFn - Function to retry the operation
 */
export const createErrorFallback = (errorType: ErrorType, retryFn?: () => void) => {
  let message = 'Something went wrong.';
  let actionText = 'Try Again';
  
  switch (errorType) {
    case ErrorType.NETWORK:
      message = 'Unable to connect to the server. Please check your internet connection.';
      break;
    case ErrorType.AUTHENTICATION:
      message = 'You need to log in to access this content.';
      actionText = 'Log In';
      break;
    case ErrorType.SERVER:
      message = 'Server error. Our team has been notified.';
      break;
    default:
      message = 'An error occurred while loading content.';
  }
  
  return {
    message,
    actionText,
    retry: retryFn
  };
}; 