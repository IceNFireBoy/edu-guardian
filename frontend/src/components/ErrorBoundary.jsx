import React, { Component } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Try to log to window for visibility
    if (window.onerror) {
      window.onerror(
        error.message,
        null, // filename
        null, // lineno
        null, // colno
        error // error
      );
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg max-w-2xl mx-auto my-8">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-500 dark:text-red-400 mr-3 mt-1 flex-shrink-0 text-2xl" />
            <div>
              <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
                Something went wrong
              </h2>
              <p className="text-red-600 dark:text-red-200 mb-4">
                {this.state.error && this.state.error.toString()}
              </p>
              
              <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-lg mb-4 overflow-auto max-h-[200px]">
                <pre className="text-xs text-red-800 dark:text-red-200 font-mono">
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </div>
              
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                Reload Page
              </button>
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