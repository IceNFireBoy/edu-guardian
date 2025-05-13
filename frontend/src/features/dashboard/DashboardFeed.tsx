import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaBook, FaTrophy, FaLightbulb, FaUser, FaFilter, 
  FaGlobe, FaBrain, FaCalendarCheck, FaSpinner, FaExclamationTriangle 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { callAuthenticatedApi } from '../../api/apiClient';
import { useUser } from '../user/useUser';
import { useToast } from '../../hooks/useToast';

interface FeedItemUser {
  _id: string;
  username: string;
  name: string;
  profileImage?: string;
}

interface FeedItemBadge {
  _id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
}

interface FeedItem {
  _id: string;
  itemType: 'activity' | 'badge' | 'note' | 'study' | 'ai';
  action: string;
  description: string;
  xpEarned: number;
  createdAt: Date;
  user: FeedItemUser;
  relatedData?: {
    badge?: FeedItemBadge;
    noteId?: string;
    title?: string;
    subject?: string;
  };
  isNew?: boolean;
}

interface FeedResponse {
  success: boolean;
  data: FeedItem[];
  pagination: {
    totalCount: number;
    hasMore: boolean;
    currentPage: number;
    totalPages: number;
  };
  error?: string;
}

type FeedFilter = 'my' | 'class' | 'global' | 'ai';

const DashboardFeed: React.FC = () => {
  const { profile } = useUser();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeedFilter>('my');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const { success: successToast, error: errorToast } = useToast();

  // Fetch feed items
  const fetchFeed = useCallback(async (resetItems: boolean = false) => {
    if (resetItems) {
      setPage(1);
      setFeedItems([]);
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await callAuthenticatedApi<FeedResponse>(
        `/api/v1/user/feed?filter=${filter}&page=${resetItems ? 1 : page}&limit=10`,
        'GET'
      );
      
      if (response.success && response.data) {
        // Format dates for all items
        const formattedItems = response.data.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt)
        }));
        
        if (resetItems) {
          setFeedItems(formattedItems);
        } else {
          setFeedItems(prev => [...prev, ...formattedItems]);
        }
        
        setHasMore(response.pagination.hasMore);
        if (!resetItems) {
          setPage(prev => prev + 1);
        }
      } else {
        throw new Error(response.error || 'Failed to fetch feed items');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching the feed');
      errorToast('Failed to load feed items');
    } finally {
      setLoading(false);
    }
  }, [filter, page, errorToast]);

  // Initial fetch
  useEffect(() => {
    fetchFeed(true);
  }, [filter, fetchFeed]);

  // Get appropriate icon for feed item type
  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'badge':
        return <FaTrophy className="text-yellow-500" />;
      case 'note':
        return <FaBook className="text-blue-500" />;
      case 'study':
        return <FaCalendarCheck className="text-green-500" />;
      case 'ai':
        return <FaLightbulb className="text-purple-500" />;
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
          
          <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
            <button 
              onClick={() => setFilter('my')} 
              className={`px-3 py-1 rounded-full text-sm font-medium flex items-center whitespace-nowrap
                ${filter === 'my' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              <FaUser className="mr-2" size={12} />
              My Activity
            </button>
            <button 
              onClick={() => setFilter('class')} 
              className={`px-3 py-1 rounded-full text-sm font-medium flex items-center whitespace-nowrap
                ${filter === 'class' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              <FaBook className="mr-2" size={12} />
              Class Feed
            </button>
            <button 
              onClick={() => setFilter('global')} 
              className={`px-3 py-1 rounded-full text-sm font-medium flex items-center whitespace-nowrap
                ${filter === 'global' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              <FaGlobe className="mr-2" size={12} />
              Global
            </button>
            <button 
              onClick={() => setFilter('ai')} 
              className={`px-3 py-1 rounded-full text-sm font-medium flex items-center whitespace-nowrap
                ${filter === 'ai' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              <FaLightbulb className="mr-2" size={12} />
              AI Usage
            </button>
          </div>
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
                    {item.user.profileImage ? (
                      <img 
                        src={item.user.profileImage} 
                        alt={item.user.name}
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
                          {item.user.name}
                          <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">@{item.user.username}</span>
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
                    
                    {/* Badge special display */}
                    {item.itemType === 'badge' && item.relatedData?.badge && (
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-100 dark:border-yellow-900/30">
                        <div className="flex items-center">
                          <FaTrophy className="text-yellow-500 mr-2" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">{item.relatedData.badge.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {item.relatedData.badge.description}
                        </p>
                      </div>
                    )}
                    
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
                No activity to display for the selected filter.
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
          <div className="p-8 text-center">
            <FaExclamationTriangle className="text-red-500 mx-auto mb-3 text-2xl" />
            <p className="text-red-500 mb-2">{error}</p>
            <button 
              onClick={() => fetchFeed(true)}
              className="text-primary hover:underline"
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