import React, { useState, useEffect } from 'react';
import { FaBug, FaChevronUp, FaChevronDown, FaTrash } from 'react-icons/fa';

// Global log storage to persist between component mounts
let debugLogs = [];

// Global debug function for use outside of components
export const debug = (message) => {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;
  
  // Add to the global logs array
  debugLogs = [...debugLogs, logEntry];
  
  // Also output to console
  console.log(message);
  
  // Dispatch a custom event to notify any listening DebugPanel instances
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('debug-log-added'));
  }
  
  return logEntry; // Return in case it's useful for chaining
};

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState(debugLogs);
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // Listen for new logs
  useEffect(() => {
    const handleNewLog = () => {
      setLogs([...debugLogs]);
    };
    
    window.addEventListener('debug-log-added', handleNewLog);
    
    return () => {
      window.removeEventListener('debug-log-added', handleNewLog);
    };
  }, []);
  
  // Clear logs
  const clearLogs = () => {
    debugLogs = [];
    setLogs([]);
  };
  
  // Only render in development
  if (import.meta.env.PROD && !import.meta.env.VITE_SHOW_DEBUG) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 right-0 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-tl-lg flex items-center shadow-lg"
        >
          <FaBug className="mr-2" /> Debug
        </button>
      ) : (
        <div className="bg-slate-800 text-white rounded-tl-lg shadow-lg w-[350px] max-w-full border border-gray-700">
          <div className="flex justify-between items-center p-2 border-b border-gray-700">
            <div className="flex items-center">
              <FaBug className="mr-2 text-yellow-400" />
              <h3 className="font-semibold">Debug Panel</h3>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={clearLogs}
                className="text-gray-400 hover:text-red-400"
                title="Clear logs"
              >
                <FaTrash />
              </button>
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-gray-400 hover:text-white"
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
                title="Close"
              >
                &times;
              </button>
            </div>
          </div>
          
          {!isCollapsed && (
            <div 
              className="p-2 max-h-[300px] overflow-y-auto font-mono text-xs"
              style={{ backgroundColor: '#1a1a1a' }}
            >
              {logs.length === 0 ? (
                <div className="text-gray-500 italic p-2">No logs yet</div>
              ) : (
                logs.map((log, index) => (
                  <div 
                    key={index} 
                    className="py-1 border-b border-gray-800 whitespace-pre-wrap"
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          )}
          
          <div className="p-2 text-xs text-gray-400 border-t border-gray-700 flex justify-between">
            <span>{logs.length} log entries</span>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                console.log('Debug logs:', debugLogs);
              }}
              className="text-blue-400 hover:underline"
            >
              Export to console
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel; 