import React, { useState, useEffect, useCallback } from 'react';
import { callAuthenticatedApi } from '../api/apiClient';
import toast from 'react-hot-toast';
import { 
  FaBell, FaCheck, FaExclamationCircle, FaTimes, 
  FaStar, FaTrophy, FaFire, FaThumbsUp, FaInfoCircle, FaSpinner 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom'; // For potential links in notifications

// --- Types & Interfaces ---

type NotificationType = 'xp_gain' | 'achievement' | 'streak' | 'rating' | 'system' | 'message' | string;

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string; // ISO Date string from backend
  link?: string; // Optional link for the notification
}

interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  error?: string;
}

interface MarkReadResponse {
  success: boolean;
  error?: string;
}

// --- Helper Function ---

const getNotificationIcon = (type: NotificationType): React.ReactElement => {
  switch (type) {
    case 'xp_gain': return <FaStar className="text-yellow-500" />;
    case 'achievement': return <FaTrophy className="text-orange-500" />;
    case 'streak': return <FaFire className="text-red-500" />;
    case 'rating': return <FaThumbsUp className="text-blue-500" />;
    case 'system': return <FaInfoCircle className="text-gray-500" />;
    case 'message': return <FaBell className="text-purple-500" />;
    default: return <FaBell className="text-gray-400" />;
  }
};

// --- Notifications Component ---

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    // Don't set loading to true on interval fetches, only initial
    // setLoading(true); 
    setError(null);
    try {
      const response = await callAuthenticatedApi<NotificationsResponse>('/api/v1/notifications', 'GET');
      if (response.success && response.data) {
        setNotifications(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch notifications.');
      }
    } catch (err: any) {
      const message = err.message || 'An unexpected error occurred.';
      setError(message);
      // Only show toast on initial load error, not interval errors unless critical
      if (loading) { 
        toast.error(`Failed to load notifications: ${message}`);
      }
      console.error("Notification fetch error:", err);
    } finally {
      // Only set loading false after the *initial* fetch
      if (loading) {
         setLoading(false);
      }
    }
  }, [loading]); // Depend on loading state to differentiate initial load

  useEffect(() => {
    fetchNotifications(); // Initial fetch
    const interval = setInterval(() => {
      fetchNotifications(); // Interval fetches
    }, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    // Optimistically update UI
    const originalNotifications = notifications;
    setNotifications(prev =>
      prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
    );

    try {
      const response = await callAuthenticatedApi<MarkReadResponse>(
        `/api/v1/notifications/${notificationId}/read`,
        'PATCH'
      );
      if (!response.success) {
        throw new Error(response.error || 'Failed to mark as read on server.');
      }
      // Success - UI already updated
      toast.success('Notification marked as read.');
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
      toast.error(err.message || 'Could not mark notification as read.');
      // Revert optimistic update on error
      setNotifications(originalNotifications);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
    if (unreadIds.length === 0) return;

    const originalNotifications = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    try {
       // Assuming an endpoint exists, otherwise call individual marks
      const response = await callAuthenticatedApi<MarkReadResponse>(
        `/api/v1/notifications/read-all`,
        'POST' // or PATCH
      );
      if (!response.success) {
        throw new Error(response.error || 'Failed to mark all as read on server.');
      }
      toast.success('All notifications marked as read.');
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
      toast.error(err.message || 'Could not mark all as read.');
      setNotifications(originalNotifications);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-3 pt-4 px-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-start gap-3 p-3">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full mt-1"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-500 dark:text-red-400 p-6 bg-red-50 dark:bg-red-900/30 rounded-lg mx-4 my-4">
          <FaExclamationCircle className="mx-auto text-2xl mb-2" />
          {error}
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8 px-4">
          You have no notifications right now.
        </p>
      );
    }

    return (
      <div className="space-y-2 max-h-[400px] overflow-y-auto px-1 pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {notifications.map(notification => (
            <motion.div
              key={notification._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className={`p-3 rounded-lg border transition-colors ${notification.read
                ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-xl mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>{notification.title}</p>
                  <p className={`text-xs mt-0.5 ${notification.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-200'}`}>
                    {notification.message}
                  </p>
                  <div className="flex flex-wrap justify-between items-center mt-1.5 gap-x-4 gap-y-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!notification.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAsRead(notification._id); }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                    {notification.link && (
                        <Link to={notification.link} className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium">
                          View Details
                        </Link>
                    )}
                  </div>
                </div>
                 {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" title="Unread"></div>
                 )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  const hasUnread = notifications.some(n => !n.read);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
          <FaBell className="mr-2 text-purple-500" />
          Notifications
        </h2>
        {hasUnread && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading} // Disable while initial load is happening
          >
            Mark all as read
          </button>
        )}
      </div>
      {renderContent()}
    </div>
  );
};

export default Notifications; 