import React, { Component } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

// Utility function to safely stringify any value
const safeStringify = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  
  try {
    if (typeof value === 'object') {
      // For Error objects, use toString()
      if (value instanceof Error) {
        return value.toString();
      }
      // For component stacks, we'll handle them specially
      if (value && value.componentStack) {
        return String(value.componentStack);
      }
      // For other objects, use JSON.stringify with fallback
      try {
        return JSON.stringify(value);
      } catch (e) {
        return '[Object]';
      }
    }
    return String(value);
  } catch (err) {
    console.error('Error in safeStringify:', err);
    return '[Value cannot be displayed]';
  }
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      errorMessage: '',
      stackTrace: ''
    };
  }

  static getDerivedStateFromError(error) {
    // Convert the error to a string immediately
    let errorMessage = '';
    try {
      errorMessage = error ? safeStringify(error) : 'An unknown error occurred';
    } catch (e) {
      errorMessage = 'Error occurred but could not be displayed';
    }
    
    // Update state so the next render will show the fallback UI with pre-stringified values
    return { 
      hasError: true, 
      errorMessage 
    };
  }

  componentDidCatch(error, errorInfo) {
    // Safely convert objects to strings before storing in state
    let stackTrace = '';
    try {
      if (errorInfo && errorInfo.componentStack) {
        stackTrace = safeStringify(errorInfo.componentStack);
      }
    } catch (e) {
      stackTrace = 'Stack trace could not be displayed';
    }
    
    // Update state with the already-stringified stack trace
    this.setState({ stackTrace });
    
    // Call the onError prop if provided
    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error in onError handler:', handlerError);
      }
    }
    
    // Log the error to console (safely)
    console.error('Error caught by boundary:', 
      safeStringify(error), 
      errorInfo ? safeStringify(errorInfo) : '');
    
    // Check if this is the React error #31 specifically
    const errorText = safeStringify(error);
    if (errorText.includes('Error: Minified React error #31')) {
      console.error('[React Error #31] Likely caused by invalid props to a component or render function');
      
      if (errorInfo && errorInfo.componentStack) {
        console.error('Component stack:', safeStringify(errorInfo.componentStack));
        
        // Try to get the component name from the stack
        try {
          const stackLines = safeStringify(errorInfo.componentStack).split('\n');
          if (stackLines.length > 1) {
            const firstComponentLine = stackLines[1].trim();
            console.error('Problematic component:', firstComponentLine);
          }
        } catch (e) {
          console.error('Could not parse component stack', e);
        }
      }
    }
    
    // Try to log to window for visibility (safely)
    if (window.onerror) {
      try {
        const errorMessage = error && error.message ? safeStringify(error.message) : safeStringify(error);
        window.onerror(
          errorMessage,
          null, // filename
          null, // lineno
          null, // colno
          error // error
        );
      } catch (e) {
        console.error('Failed to log to window.onerror', e);
      }
    }
    
    // Log to any error display element (safely)
    try {
      const errorDisplay = document.getElementById('error-display');
      if (errorDisplay) {
        errorDisplay.style.display = 'block';
        const errorStr = safeStringify(error);
        const stackStr = safeStringify(errorInfo && errorInfo.componentStack ? errorInfo.componentStack : '');
        errorDisplay.innerHTML += `<p><strong>ERROR BOUNDARY CAUGHT:</strong> ${errorStr}<br/><pre>${stackStr}</pre></p>`;
      }
    } catch (displayError) {
      console.error('Failed to log to error display:', displayError);
    }
  }

  render() {
    if (this.state.hasError) {
      // Check if there's a specific fallback component provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI - only using already stringified values from state
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg max-w-2xl mx-auto my-8">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-500 dark:text-red-400 mr-3 mt-1 flex-shrink-0 text-2xl" />
            <div>
              <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
                Something went wrong
              </h2>
              <p className="text-red-600 dark:text-red-200 mb-4">
                {this.state.errorMessage}
              </p>
              
              {this.state.stackTrace ? (
                <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-lg mb-4 overflow-auto max-h-[200px]">
                  <pre className="text-xs text-red-800 dark:text-red-200 font-mono">
                    {this.state.stackTrace}
                  </pre>
                </div>
              ) : null}
              
              <div className="flex space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                >
                  Reload Page
                </button>
                
                <button
                  onClick={() => window.history.back()}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Render children if no error
    return this.props.children;
  }
}

export default ErrorBoundary; 