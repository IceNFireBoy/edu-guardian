import React from 'react';
import { UserActivity } from '../userTypes';
import { FaClock, FaBookOpen, FaUpload, FaComment, FaStar, FaUser, FaSync } from 'react-icons/fa';

interface ActivityLogProps {
  activities: UserActivity[];
  limit?: number;
  className?: string;
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
      return <FaStar className="text-yellow-500" />;
    case 'streak':
      return <FaSync className="text-indigo-500" />;
    default:
      return <FaClock className="text-gray-500" />;
  }
};

// Helper to format relative time (e.g., "2 hours ago")
const getRelativeTime = (timestamp: Date) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);
  
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
    return activityTime.toLocaleDateString();
  }
};

const ActivityLog: React.FC<ActivityLogProps> = ({ activities, limit = 10, className = '' }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className={`text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
        <FaClock className="text-gray-400 text-4xl mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-500">No Activity Yet</h3>
        <p className="text-sm text-gray-400 mt-1">
          Your activities will appear here as you use the platform.
        </p>
      </div>
    );
  }

  // Get the most recent activities up to the limit
  const recentActivities = activities.slice(0, limit);

  return (
    <div className={`${className}`}>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {recentActivities.map((activity) => (
          <li key={activity.id} className="py-3 flex items-start">
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
      
      {activities.length > limit && (
        <div className="text-center mt-4">
          <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
            View all activities
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityLog; 