import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { checkApiHealth } from '../../api/apiClient';

// Connection state. 'waking' covers the Render free-tier cold start: the
// server spins down when idle and takes 30-60s to come back, which is
// expected behavior, not an outage - so it gets a calmer banner.
type ApiState = 'checking' | 'up' | 'waking' | 'down';

const FAILURES_BEFORE_DOWN = 3;
const POLL_WHILE_UP_MS = 60000;
const POLL_WHILE_DEGRADED_MS = 15000;

// Owns ALL connectivity UI (banner + toasts). checkApiHealth itself is quiet.
const NetworkStatusMonitor: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiState, setApiState] = useState<ApiState>('checking');
  const failureCount = useRef(0);

  const runHealthCheck = async () => {
    const connected = await checkApiHealth();
    if (connected) {
      failureCount.current = 0;
      setApiState(prev => {
        if (prev === 'down') {
          toast.success('Connection to server restored', { id: 'api-connection' });
        }
        return 'up';
      });
    } else {
      failureCount.current += 1;
      setApiState(prev => {
        if (failureCount.current >= FAILURES_BEFORE_DOWN) {
          if (prev !== 'down') {
            toast.error('Unable to reach the server', { id: 'api-connection' });
          }
          return 'down';
        }
        return prev === 'up' || prev === 'checking' ? 'waking' : prev;
      });
    }
  };

  // Monitor browser online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Internet connection restored', { id: 'online-status' });
      runHealthCheck();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('No internet connection', { id: 'offline-status' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Health check on mount and on an interval that tightens while degraded
  useEffect(() => {
    if (!isOnline) return;

    runHealthCheck();
    const intervalMs = apiState === 'up' || apiState === 'checking'
      ? POLL_WHILE_UP_MS
      : POLL_WHILE_DEGRADED_MS;
    const interval = setInterval(runHealthCheck, intervalMs);

    return () => clearInterval(interval);
  }, [isOnline, apiState]);

  if (!isOnline) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-red-500 text-white py-2 px-4 text-center z-50">
        <p>You are offline. Please check your internet connection.</p>
      </div>
    );
  }

  if (apiState === 'waking') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-amber-500 text-white py-2 px-4 text-center z-50">
        <p>Server is waking up (free hosting) &mdash; this can take up to a minute&hellip;</p>
      </div>
    );
  }

  if (apiState === 'down') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-red-500 text-white py-2 px-4 text-center z-50">
        <p>Unable to connect to server. Please try again later.</p>
      </div>
    );
  }

  return null;
};

export default NetworkStatusMonitor;
