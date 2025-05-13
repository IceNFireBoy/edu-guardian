import React from 'react';
import { FaUndo } from 'react-icons/fa'; // Use an icon for reload

interface FallbackProps {
  message?: string; // Allow optional custom message
  onReload?: () => void; // Allow custom reload logic if needed
}

// A fallback component using Tailwind for styling
const Fallback: React.FC<FallbackProps> = ({ 
  message = "We're experiencing some technical difficulties.",
  onReload = () => window.location.reload(),
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="p-6 sm:p-8 max-w-xl w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl text-center border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          EduGuardian
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Please try:</p>
        <ul className="text-left list-disc list-inside mx-auto max-w-md text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-6">
          <li>Refreshing the page</li>
          <li>Checking your internet connection</li>
          <li>Trying again in a few minutes</li>
        </ul>
        <button 
          onClick={onReload}
          className="btn btn-primary inline-flex items-center"
        >
          <FaUndo className="mr-2" />
          Reload Page
        </button>
      </div>
    </div>
  );
};

export default Fallback; 