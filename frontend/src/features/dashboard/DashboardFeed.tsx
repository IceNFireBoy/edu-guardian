import React, { useState, useEffect, useCallback } from 'react';
import {
  FaBook, FaTrophy, FaLightbulb, FaUser, FaFilter,
  FaCalendarCheck, FaSpinner
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { callAuthenticatedApi } from '../../api/apiClient';
import { useUser } from '../user/useUser';
import { useToast } from '../../hooks/useToast';

interface FeedItem {
  _id: string;
  itemType: 'activity' | 'badge' | 'note' | 'study';
  action: string;
  description: string;
  xpEarned: number;
  createdAt: Date;
  isNew?: boolean;
}

// Backend: GET /users/feed -> { success, data: { activities, count, totalPages, currentPage } }
// Activities are the user's own activity log entries.
interface BackendActivity {
  _id?: string;
  action: string;
  description: string;
  xpEarned?: number;
  timestamp: string | Date;
}

interface FeedApiResponse {
  success: boolean;
  data?: {
    activities: BackendActivity[];
    count: number;
    totalPages: number;
    currentPage: number;
  };
  error?: string;
  message?: string;
}

// Map backend activity actions to a display category
const ACTION_TO_ITEM_TYPE: Record<string, FeedItem['itemType']> = {
  earn_badge: 'badge',
  upload: 'note',
  download: 'note',
  study: 'study'
};

const DashboardFeed: React.FC = () => {
  const { profile } = useUser();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const { success: successToast, error: errorToast } = useToast();
  const [hasShownError, setHasShownError] = useState(false);

  // Fetch feed items
  const fetchFeed = useCallback(async (resetItems: boolean = false) => {
    if (resetItems) {
      setPage(1);
      setFeedItems([]);
      setHasShownError(false); // Reset error toast throttle on manual retry
    }
    setLoading(true);
    setError(null);
    try {
      const currentPage = resetItems ? 1 : page;
      const response = await callAuthenticatedApi<FeedApiResponse>(
        `/users/feed?page=${currentPage}&limit=10`,
        'GET'
      );
      const payload = response?.data;
      if (response?.success && payload && Array.isArray(payload.activities)) {
        const formattedItems: FeedItem[] = payload.activities.map((activity, index) => ({
          _id: activity._id || `activity-${currentPage}-${index}`,
          itemType: ACTION_TO_ITEM_TYPE[activity.action] ?? 'activity',
          action: activity.action,
          description: activity.description,
          xpEarned: activity.xpEarned ?? 0,
          createdAt: new Date(activity.timestamp)
        }));
        if (resetItems) {
          setFeedItems(formattedItems);
        } else {
          setFeedItems(prev => [...prev, ...formattedItems]);
        }
        setHasMore((payload.currentPage ?? 1) < (payload.totalPages ?? 1));
        if (!resetItems) {
          setPage(prev => prev + 1);
        }
        setHasShownError(false); // Reset error state on success
      } else {
        setFeedItems([]);
        throw new Error(response?.error || 'No activity feed data available');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching the feed');
      if (!hasShownError) {
        errorToast('Failed to load feed items');
        setHasShownError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [page, errorToast, hasShownError]);

  // Initial fetch
  useEffect(() => {
    fetchFeed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get appropriate icon for feed item type
  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'badge':
        return <FaTrophy className="text-yellow-500" />;
      case 'note':
        return <FaBook className="text-blue-500" />;
      case 'study':
        return <FaCalendarCheck className="text-green-500" />;
      default:
        return <FaUser className="text-gray-500" />;
    }
  };

  // Format relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) { // 7 days
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-0">Activity Feed</h2>
          
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <AnimatePresence>
          {feedItems.length > 0 ? (
            feedItems.map((item, index) => (
              <motion.div
                key={item._id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`p-4 ${item.isNew ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              >
                <div className="flex">
                  <div className="flex-shrink-0 mr-4">
                    {profile?.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt={profile.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <FaUser className="text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {profile?.name ?? 'You'}
                          {profile?.username && (
                            <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">@{profile.username}</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getItemIcon(item.itemType)}
                        {item.xpEarned > 0 && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                            +{item.xpEarned} XP
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {getRelativeTime(item.createdAt)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : !loading && !error ? (
            <div className="p-12 text-center">
              <FaFilter className="mx-auto mb-4 text-gray-400 text-4xl" />
              <p className="text-gray-500 dark:text-gray-400">
                No activity yet — study or upload a note to get started.
              </p>
            </div>
          ) : null}
        </AnimatePresence>
        
        {loading && (
          <div className="p-8 text-center">
            <FaSpinner className="animate-spin text-primary mx-auto mb-3 text-2xl" />
            <p className="text-gray-500 dark:text-gray-400">Loading activity items...</p>
          </div>
        )}
        
        {error && (
          <div className="p-6 text-center text-red-600 dark:text-red-400">
            <div className="mb-2">{error}</div>
            <button
              className="btn btn-primary mt-2"
              onClick={() => fetchFeed(true)}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
      
      {hasMore && !loading && !error && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <button 
            className="btn btn-outline-primary text-sm"
            onClick={() => fetchFeed()}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardFeed; 