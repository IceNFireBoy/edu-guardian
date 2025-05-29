import React from 'react';
import { UserActivity } from '../userTypes';
import { FaClock, FaBookOpen, FaUpload, FaComment, FaStar, FaUser, FaSync, FaAward } from 'react-icons/fa';
import { AiOutlineRobot } from 'react-icons/ai';
import { getRelativeTime } from '../../../utils/dateUtils';
import ErrorFallback from '../../../components/ui/ErrorFallback';
import useFetch from '../../../hooks/useFetch';
import { ErrorType } from '../../../utils/errorHandler';

interface ActivityLogProps {
  userId?: string;
  activities?: UserActivity[];
  limit?: number;
  className?: string;
  showLoadMore?: boolean;
}

// Helper to get the appropriate icon for each activity type
const getActivityIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case 'login':
      return <FaUser className="text-blue-500" />;
    case 'study':
      return <FaBookOpen className="text-green-500" />;
    case 'upload':
      return <FaUpload className="text-purple-500" />;
    case 'comment':
      return <FaComment className="text-orange-500" />;
    case 'rate':
    case 'rating':
      return <FaStar className="text-yellow-500" />;
    case 'streak':
      return <FaSync className="text-indigo-500" />;
    case 'badge':
    case 'badge_earned':
      return <FaAward className="text-amber-500" />;
    case 'ai_summary_generated':
    case 'ai_flashcards_generated':
      return <AiOutlineRobot className="text-teal-500" />;
    default:
      return <FaClock className="text-gray-500" />;
  }
};

const ActivityLogSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="py-3 flex items-start">
          <div className="mr-4 mt-1 bg-gray-300 dark:bg-gray-700 h-5 w-5 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ActivityLog: React.FC<ActivityLogProps> = ({ 
  userId, 
  activities: propActivities, 
  limit = 10, 
  className = '',
  showLoadMore = false
}) => {
  const [viewLimit, setViewLimit] = React.useState(limit);
  
  // Only fetch if userId is provided and no activities are passed directly
  const { data, loading, error, errorType, fetch } = useFetch<{ activities: UserActivity[] }>({
    url: userId ? `/users/${userId}/activity` : '',
    autoFetch: Boolean(userId && !propActivities),
    dependencies: [userId, viewLimit],
    method: 'GET',
    body: { limit: viewLimit }
  });
  
  // Use activities from props if provided, otherwise from the fetch
  const activities = propActivities || data?.activities || [];
  
  if (loading && !activities.length) {
    return <ActivityLogSkeleton />;
  }
  
  if (error && !activities.length) {
    return (
      <ErrorFallback 
        errorType={errorType || ErrorType.UNKNOWN} 
        message="Failed to load activity feed"
        onRetry={() => fetch()}
      />
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className={`text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
        <FaClock className="text-gray-400 text-4xl mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-300">No Activity Yet</h3>
        <p className="text-sm text-gray-400 mt-1">
          Your activities will appear here as you use the platform.
        </p>
      </div>
    );
  }

  // Get the most recent activities up to the limit
  const recentActivities = activities.slice(0, viewLimit);
  const hasMore = activities.length > viewLimit;

  const handleLoadMore = () => {
    setViewLimit(prev => prev + limit);
  };

  return (
    <div className={`${className}`}>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {recentActivities.map((activity) => (
          <li key={activity._id} className="py-3 flex items-start">
            <div className="mr-4 mt-1">
              {getActivityIcon(activity.action)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {activity.description || activity.action}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                <FaClock className="mr-1 text-gray-400" size={12} />
                {getRelativeTime(activity.timestamp)}
                {activity.xpEarned > 0 && (
                  <span className="ml-2 text-green-500 font-medium">+{activity.xpEarned} XP</span>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
      
      {loading && activities.length > 0 && (
        <div className="text-center mt-4">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      )}
      
      {(hasMore || showLoadMore) && !loading && (
        <div className="text-center mt-4">
          <button 
            className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
            onClick={handleLoadMore}
          >
            View more activities
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityLog; 