import React, { useEffect, useState } from 'react';
import { FaUser, FaSpinner, FaCog, FaChevronRight, FaExclamationTriangle, FaBrain, FaChartLine, FaFire, FaTrophy, FaStar, FaLightbulb, FaAward } from 'react-icons/fa';
import { useUser } from './useUser';
import UserStatsCard from './components/UserStatsCard';
import AIQuotaDisplay from './components/AIQuotaDisplay';
import BadgeGrid from './components/BadgeGrid';
import ActivityLog from './components/ActivityLog';
import { UserBadge } from './userTypes';

// Simple Analytics Card sub-component
interface AnalyticsItemProps {
  icon: React.ReactElement;
  label: string;
  value: string | number;
  className?: string;
}

const AnalyticsItem: React.FC<AnalyticsItemProps> = ({ icon, label, value, className }) => (
  <div className={`flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg ${className}`}>
    <div className="mr-3 text-xl text-primary">{icon}</div>
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{value}</div>
    </div>
  </div>
);

const ProfilePage: React.FC = () => {
  const { profile, loading, error, fetchUserProfile } = useUser();
  
  // Add a manual refresh state to show feedback
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!profile) {
      fetchUserProfile();
    }
  }, [profile, fetchUserProfile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setTimeout(() => setRefreshing(false), 600); // Add slight delay for feedback
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
        <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-lg max-w-md">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Error Loading Profile</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <button 
            onClick={fetchUserProfile}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center">
          <div className="mr-4">
            {profile?.profileImage ? (
              <img 
                src={profile.profileImage}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <FaUser className="text-primary text-2xl" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">@{profile?.username}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ''}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={handleRefresh} 
            className="btn btn-outline-primary"
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Refreshing...
              </>
            ) : (
              'Refresh Data'
            )}
          </button>
          <button className="btn btn-outline-secondary">
            <FaCog className="mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* User Stats Card */}
      {profile && (
        <UserStatsCard
          xp={profile.xp}
          level={profile.level}
          streak={profile.streak}
          className="mb-8"
          newXp={0}
        />
      )}

      {/* Main Content - 2 column layout on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Analytics Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
                <FaChartLine className="text-xl text-primary mr-2" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Engagement</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnalyticsItem 
                    icon={<FaFire />} 
                    label="AI Usage Streak" 
                    value={`${profile?.streak?.current ?? 0} day(s)`}
                />
                 <AnalyticsItem 
                    icon={<FaBrain />} 
                    label="AI Summaries Today" 
                    value={`${profile?.aiUsage?.summaryUsed ?? 0}`}
                />
                <AnalyticsItem 
                    icon={<FaLightbulb />}
                    label="AI Flashcards Today" 
                    value={`${profile?.aiUsage?.flashcardUsed ?? 0}`}
                />
            </div>
          </div>

          {/* Gamification Analytics Section */}
          {profile && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 mt-8">
              <div className="flex items-center mb-4">
                  <FaTrophy className="text-xl text-amber-500 mr-2" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Achievements</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <AnalyticsItem 
                      icon={<FaAward />}
                      label="Total Badges Earned" 
                      value={profile.badges?.length ?? 0}
                  />
                  <AnalyticsItem 
                      icon={<FaStar />} 
                      label="XP from Badges" 
                      value={profile.badges?.reduce((sum, badge) => sum + badge.xpReward, 0) ?? 0}
                  />
                  <AnalyticsItem 
                      icon={<FaTrophy />}
                      label="Highest Badge Tier" 
                      value={getHighestBadgeTier(profile.badges)}
                  />
              </div>
            </div>
          )}

          {/* AI Quota */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">AI Feature Usage</h2>
            <AIQuotaDisplay aiUsage={profile?.aiUsage} />
          </div>

          {/* Badges */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Earned Badges</h2>
              <button className="text-primary dark:text-primary-light text-sm flex items-center hover:underline">
                View All <FaChevronRight className="ml-1 text-xs" />
              </button>
            </div>
            { profile && 
              <BadgeGrid badges={[
                ...(profile.badges || []),
              ]} />
            }
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* User Bio */}
          {profile?.biography && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About Me</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{profile.biography}</p>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
              <button className="text-primary dark:text-primary-light text-sm flex items-center hover:underline">
                View All <FaChevronRight className="ml-1 text-xs" />
              </button>
            </div>
            <ActivityLog activities={profile?.activity || []} limit={5} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to determine the highest badge tier
const getHighestBadgeTier = (badges: UserBadge[] | undefined): string => {
  if (!badges || badges.length === 0) return 'None';
  const tierOrder = { platinum: 4, gold: 3, silver: 2, bronze: 1 };
  let highestTier = 'bronze'; // Default to lowest
  let maxOrder = 0;

  badges.forEach(badge => {
    const order = tierOrder[badge.level as keyof typeof tierOrder] || 0;
    if (order > maxOrder) {
      maxOrder = order;
      highestTier = badge.level;
    }
  });
  return highestTier.charAt(0).toUpperCase() + highestTier.slice(1);
};

export default ProfilePage; 