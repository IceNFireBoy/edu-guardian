import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Fallback from './components/Fallback.jsx';
import './index.css';
import './styles/pdf-thumbnails.css';

// Log any startup errors
console.log('Starting application...');

// Add a global error handler to catch and log any unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Prevent default behavior to allow our error boundary to handle it
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Log additional details if available
  if (event.reason && event.reason.stack) {
    console.error('Stack trace:', event.reason.stack);
  }
});

// Create a custom error handler for the ErrorBoundary
const handleError = (error, errorInfo) => {
  console.error('Error caught by root boundary:', error);
  if (errorInfo && errorInfo.componentStack) {
    console.error('Component stack:', errorInfo.componentStack);
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<Fallback />} onError={handleError}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
