import React, { useState, useEffect, useRef } from 'react';
import { FaBug, FaChevronUp, FaChevronDown, FaTrash, FaTimes } from 'react-icons/fa';

// --- Global Debug Log Management ---
let globalDebugLogs: string[] = [];

// Custom event name
const DEBUG_LOG_ADDED_EVENT = 'debug-log-added';

// Global debug function for use outside of components
export const debug = (message: any, ...optionalParams: any[]): string => {
  const timestamp = new Date().toLocaleTimeString();
  const messageStr = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
  const paramsStr = optionalParams.map(p => typeof p === 'string' ? p : JSON.stringify(p, null, 2)).join(' ');
  
  const logEntry = `[${timestamp}] ${messageStr}${paramsStr ? ' ' + paramsStr : ''}`;
  
  globalDebugLogs = [logEntry, ...globalDebugLogs]; // Add to top for newest first
  if (globalDebugLogs.length > 200) { // Limit log size
    globalDebugLogs.pop();
  }
  
  // Also output to console for convenience
  console.debug('[DEBUG]', message, ...optionalParams);
  
  // Dispatch a custom event to notify any listening DebugPanel instances
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DEBUG_LOG_ADDED_EVENT));
  }
  
  return logEntry; 
};

// --- DebugPanel Component ---
const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>(globalDebugLogs);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleNewLog = () => {
      setLogs([...globalDebugLogs]);
    };
    
    window.addEventListener(DEBUG_LOG_ADDED_EVENT, handleNewLog);
    return () => {
      window.removeEventListener(DEBUG_LOG_ADDED_EVENT, handleNewLog);
    };
  }, []);

  // Scroll to bottom when logs update and panel is open & expanded
  useEffect(() => {
    if (isOpen && !isCollapsed && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = 0; // Scroll to top since new logs are added at the beginning
    }
  }, [logs, isOpen, isCollapsed]);
  
  const clearLogs = () => {
    globalDebugLogs = [];
    setLogs([]);
    debug('Debug logs cleared.');
  };
  
  // Conditional rendering based on environment variables
  const showDebugPanel = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEBUG === 'true';
  if (!showDebugPanel) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-[1000] flex flex-col items-end">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg flex items-center shadow-xl text-sm font-medium"
          aria-label="Open Debug Panel"
        >
          <FaBug className="mr-2" /> Debug
        </button>
      ) : (
        <div className="bg-gray-800 text-gray-200 rounded-lg shadow-xl w-[400px] max-w-[calc(100vw-2rem)] border border-gray-700 flex flex-col max-h-[50vh]">
          {/* Header */}
          <div className="flex justify-between items-center p-2 border-b border-gray-700 bg-gray-700/50 rounded-t-lg">
            <div className="flex items-center">
              <FaBug className="mr-2 text-yellow-400" />
              <h3 className="font-semibold text-sm">Debug Panel</h3>
            </div>
            <div className="flex space-x-1.5">
              <button 
                onClick={clearLogs}
                className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-gray-700"
                title="Clear logs"
              >
                <FaTrash size={14} />
              </button>
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
                title={isCollapsed ? "Expand Logs" : "Collapse Logs"}
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? <FaChevronDown size={14} /> : <FaChevronUp size={14} />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
                title="Close Panel"
                aria-label="Close Debug Panel"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>
          
          {/* Logs Area - only renders content if not collapsed */}
          {!isCollapsed && (
            <div 
              ref={logsContainerRef}
              className="p-3 flex-grow overflow-y-auto font-mono text-xs bg-gray-900 h-[250px]"
            >
              {logs.length === 0 ? (
                <div className="text-gray-500 italic p-2">No logs yet. Use `debug('message')` in your code.</div>
              ) : (
                logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`py-1.5 border-b border-gray-700/50 whitespace-pre-wrap break-words ${index === 0 ? 'text-yellow-300' : 'text-gray-300'}`}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          )}
          
          {/* Footer */}
          <div className="p-2 text-xs text-gray-500 border-t border-gray-700 flex justify-between items-center bg-gray-700/30 rounded-b-lg">
            <span>{logs.length} log entries</span>
            <button 
              onClick={(e) => {
                e.preventDefault();
                console.log('EduGuardian Debug Logs Snapshot:', globalDebugLogs);
                alert('Logs exported to browser console.');
              }}
              className="text-blue-400 hover:underline"
            >
              Export to console
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel; 