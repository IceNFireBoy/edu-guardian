import React, { useState, useEffect, useCallback } from 'react';
import { FaTrophy, FaCrown, FaMedal, FaSpinner } from 'react-icons/fa';
import { callAuthenticatedApi } from '../api/apiClient'; // Use the general API client
import toast from 'react-hot-toast';

// --- Types & Interfaces ---

interface LeaderboardUser {
  _id: string;
  name: string;
  username: string; // Added username for potential future use
  profileImage?: string;
  xp: number;
  level: number;
  currentStreak: number;
}

interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardUser[];
  error?: string;
}

type Timeframe = 'all' | 'month' | 'week';

// --- Helper Functions ---

const getRankIcon = (rank: number): React.ReactElement => {
  if (rank === 1) return <FaCrown className="text-yellow-500" />;
  if (rank === 2) return <FaMedal className="text-gray-400" />;
  if (rank === 3) return <FaTrophy className="text-yellow-700" />;
  return <span className="text-gray-500 font-semibold">{rank}</span>;
};

const getTimeframeLabel = (timeframe: Timeframe): string => {
  switch (timeframe) {
    case 'week': return 'This Week';
    case 'month': return 'This Month';
    default: return 'All Time';
  }
};

// --- Leaderboard Component ---

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('all');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Assuming the API endpoint is standardized
      const response = await callAuthenticatedApi<LeaderboardResponse>(
        `/api/v1/leaderboard?timeframe=${timeframe}`, 
        'GET'
      );
      
      if (response.success && response.data) {
        setLeaderboard(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch leaderboard data.');
      }
    } catch (err: any) {
      console.error("Leaderboard fetch error:", err);
      const message = err.message || 'An unexpected error occurred while fetching the leaderboard.';
      setError(message);
      toast.error(message); 
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-5 pb-4 border-b border-gray-200 dark:border-gray-700 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <FaTrophy className="mr-3 text-indigo-500" />
          Leaderboard 
          <span className="text-base font-medium text-gray-500 dark:text-gray-400 ml-2">
            ({getTimeframeLabel(timeframe)})
          </span>
        </h2>
        <div className="flex gap-1 sm:gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg w-full sm:w-auto">
          {(['week', 'month', 'all'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-none ${ 
                timeframe === tf
                  ? 'bg-white dark:bg-gray-800 text-primary shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              disabled={loading}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 pt-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-3">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center text-red-500 dark:text-red-400 p-6 bg-red-50 dark:bg-red-900/30 rounded-lg">
          {error}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No leaderboard data available for this timeframe yet.
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((user, index) => (
            <div
              key={user._id}
              className={`flex items-center gap-3 sm:gap-4 p-3 rounded-lg transition-colors ${index < 3 ? 'bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
            >
              <div className="w-6 h-8 flex items-center justify-center text-sm sm:text-base">
                {getRankIcon(index + 1)}
              </div>
              <img 
                src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`} 
                alt={`${user.name}'s profile`} 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm sm:text-base text-gray-800 dark:text-white truncate" title={user.name}>{user.name}</div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Level {user.level} {user.currentStreak > 0 && `• ${user.currentStreak} day streak 🔥`}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm sm:text-base">{user.xp.toLocaleString()} XP</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard; 