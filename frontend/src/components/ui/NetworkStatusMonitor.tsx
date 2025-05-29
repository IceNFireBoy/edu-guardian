import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { checkApiHealth } from '../../api/apiClient';

const NetworkStatusMonitor: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Internet connection restored', { id: 'online-status' });
      checkApiHealth().then(setApiConnected);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setApiConnected(false);
      toast.error('No internet connection', { id: 'offline-status' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial API health check
    if (isOnline) {
      checkApiHealth().then(setApiConnected);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Perform periodic API health checks when online
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      checkApiHealth().then(connected => {
        // Only notify if state changes from connected to disconnected or vice versa
        if (apiConnected !== null && connected !== apiConnected) {
          if (connected) {
            toast.success('Connection to server restored', { id: 'api-connection' });
          } else {
            toast.error('Lost connection to server', { id: 'api-connection' });
          }
        }
        setApiConnected(connected);
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline, apiConnected]);

  // Only render error banner when offline or API is disconnected
  if (isOnline && (apiConnected === null || apiConnected === true)) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-red-500 text-white py-2 px-4 text-center z-50">
      {!isOnline ? (
        <p>You are offline. Please check your internet connection.</p>
      ) : (
        <p>Unable to connect to server. Please try again later.</p>
      )}
    </div>
  );
};

export default NetworkStatusMonitor; 