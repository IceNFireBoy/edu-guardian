import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaUpload, FaSearch, FaChartLine, FaSpinner } from 'react-icons/fa';
import DashboardFeed from '../features/dashboard/DashboardFeed';
// Assuming useUser provides the necessary type for profile
import { useUser } from '../features/user/useUser';
// Assuming UserStatsCard props match the profile data or define its own interface
import UserStatsCard from '../features/user/components/UserStatsCard';
// Import the extracted FeatureCard component
import FeatureCard from '../components/ui/FeatureCard';

// Define the structure for a Feature if not defined elsewhere
interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  to: string;
  color: string;
}

const HomePage: React.FC = () => {
  const { profile, loading } = useUser();
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedDashboard');
    if (hasVisited) {
      setShowWelcome(false);
    } else {
      localStorage.setItem('hasVisitedDashboard', 'true');
    }
  }, []);

  // Explicitly type the features array
  const features: Feature[] = [
    {
      icon: <FaUpload className="text-primary" size={24} />,
      title: "Upload Notes",
      description: "Share your knowledge by uploading your academic notes to help others learn.",
      // TODO: Link should probably be /upload or similar, not /donate?
      to: "/donate",
      color: "border-primary" // Assumes 'primary' is defined in Tailwind config
    },
    {
      icon: <FaSearch className="text-green-500" size={24} />,
      title: "Find Study Material",
      description: "Search and filter through a wide range of notes based on subject, grade, and more.",
      to: "/my-notes",
      color: "border-green-500"
    },
    {
      icon: <FaChartLine className="text-purple-500" size={24} />,
      title: "Track Progress",
      description: "Monitor your learning journey with XP points and day streaks.",
      to: "/progress",
      color: "border-purple-500"
    }
  ];

  return (
    <div className="space-y-8">
      {/* User Stats (only when logged in and profile loaded) */}
      {/* Add explicit checks for profile properties if needed by UserStatsCard */}
      {profile && (
        <UserStatsCard xp={profile.xp} level={profile.level} streak={profile.streak} />
      )}
      
      {/* Welcome Message */}
      {showWelcome && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Welcome to EduGuardian</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your secure, gamified platform for academic notes and resources.
          </p>
        </motion.div>
      )}
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Activity Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Activity Feed</h2>
          {loading ? (
            <div className="p-12 flex items-center justify-center text-gray-600 dark:text-gray-300">
              <FaSpinner className="animate-spin text-primary mr-3" size={24} />
              <span>Loading your dashboard...</span>
            </div>
          ) : (
            // Pass profile data if needed by DashboardFeed
            <DashboardFeed />
          )}
        </div>
        
        {/* Right Side - Quick Actions & Info */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
          
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.03 }} // Add subtle hover effect
            >
              <Link 
                to={feature.to}
                className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
              >
                {/* Adjusted bg color heuristic */}
                <div className={`p-3 rounded-full mr-4 ${feature.color.replace('border-', 'bg-')} bg-opacity-10`}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {feature.description.substring(0, 60)}...
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
          
          {/* Did You Know Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800/50 dark:to-gray-900/30 p-4 rounded-lg border border-blue-200 dark:border-gray-700 shadow-sm">
            <h3 className="font-medium text-lg mb-2 text-blue-800 dark:text-blue-300">Did You Know?</h3>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              You can earn XP and badges by uploading notes, studying regularly, and helping others. Check your <Link to="/badges" className="font-semibold underline hover:text-blue-600 dark:hover:text-blue-100">Badges</Link>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 