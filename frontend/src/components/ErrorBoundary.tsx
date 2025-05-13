import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

// --- Utility Function ---

// Utility function to safely stringify any value, ensuring no errors during logging
const safeStringify = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  
  try {
    if (value instanceof Error) {
      // Include name, message, and potentially stack if available
      let errorString = `${value.name}: ${value.message}`;
      if (value.stack) {
          errorString += `\nStack: ${value.stack}`;
      }
      return errorString;
    }
    // Check for component stack specifically if passed directly
    if (typeof value === 'object' && value !== null && 'componentStack' in value) {
      return String(value.componentStack);
    }
    // Attempt to stringify other objects/values
    return JSON.stringify(value, null, 2); // Pretty print objects
  } catch (err) {
    // Fallback for complex objects or circular references
    try {
      return String(value);
    } catch (stringifyErr) {
      console.error('Error in safeStringify fallback:', stringifyErr);
      return '[Value cannot be displayed]';
    }
  }
};

// --- Component Props and State ---

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom fallback UI component
  onError?: (error: Error, errorInfo: ErrorInfo) => void; // Optional error reporting callback
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  errorStack: string; // Specifically for the component stack
}

// --- Error Boundary Component ---

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      errorMessage: '',
      errorStack: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render shows the fallback UI.
    // We only capture the basic error message here.
    return { 
      hasError: true, 
      errorMessage: safeStringify(error) || 'An unknown error occurred' 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Capture the component stack trace
    const errorStack = errorInfo?.componentStack ? safeStringify(errorInfo.componentStack) : 'Component stack not available';
    this.setState({ errorStack });
    
    // Log the error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    console.error('Error Message:', this.state.errorMessage);
    console.error('Component Stack:', errorStack);

    // Call the optional onError prop for external logging (e.g., Sentry)
    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error executing onError handler:', handlerError);
      }
    }
    
    // Optional: Log to a global error display element if it exists
    try {
      const errorDisplay = document.getElementById('global-error-display');
      if (errorDisplay) {
        errorDisplay.style.display = 'block';
        errorDisplay.innerHTML += `<p><strong>ERROR BOUNDARY:</strong> ${this.state.errorMessage}<br/><pre>${errorStack}</pre></p>`;
      }
    } catch (displayError) {
      console.error('Failed to log to global error display element:', displayError);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Render default fallback UI
      return (
        <div className="p-4 sm:p-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg max-w-3xl mx-auto my-6 shadow-md">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-500 dark:text-red-400 mr-4 mt-1 flex-shrink-0 text-2xl" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-red-700 dark:text-red-300 mb-2">
                Oops! Something went wrong.
              </h2>
              <p className="text-red-600 dark:text-red-200 mb-4 text-sm sm:text-base">
                We encountered an unexpected issue. Please try the actions below.
              </p>
              
              {/* Display Error Message */}
              <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-md mb-4">
                <p className="text-xs sm:text-sm text-red-800 dark:text-red-200 font-semibold">Error Details:</p>
                <p className="text-xs text-red-700 dark:text-red-300 font-mono whitespace-pre-wrap break-words">
                  {this.state.errorMessage}
                </p>
              </div>
              
              {/* Display Stack Trace if available */}
              {this.state.errorStack && (
                <details className="mb-4">
                  <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:underline">Show Component Stack</summary>
                  <div className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-md mt-2 overflow-auto max-h-[150px]">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                      {this.state.errorStack}
                    </pre>
                  </div>
                </details>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-sm bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="btn btn-sm btn-secondary"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Render children normally if no error occurred
    return this.props.children;
  }
}

export default ErrorBoundary; 