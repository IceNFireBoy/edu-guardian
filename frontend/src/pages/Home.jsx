import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaUpload, FaSearch, FaChartLine } from 'react-icons/fa';

const FeatureCard = ({ icon, title, description, to, color }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className={`bg-white p-6 rounded-lg shadow-lg border-t-4 ${color}`}
  >
    <div className="flex items-center mb-4">
      <div className={`p-3 rounded-full ${color.replace('border', 'bg')} bg-opacity-10`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold ml-3">{title}</h3>
    </div>
    <p className="text-gray-600 mb-4">{description}</p>
    <Link to={to} className="text-primary font-medium hover:underline">
      Explore →
    </Link>
  </motion.div>
);

const HomePage = () => {
  const features = [
    {
      icon: <FaUpload className="text-primary" size={24} />,
      title: "Upload Notes",
      description: "Share your knowledge by uploading your academic notes to help others learn.",
      to: "/donate",
      color: "border-primary"
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
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-bold mb-4">Welcome to EduGuardian</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Your secure, gamified platform for academic notes and resources.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <FeatureCard {...feature} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-primary/5 p-6 rounded-lg"
      >
        <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Browse existing notes in the <Link to="/my-notes" className="text-primary hover:underline">My Notes</Link> section</li>
          <li>Upload your own study materials in the <Link to="/donate" className="text-primary hover:underline">Donate</Link> section</li>
          <li>Keep track of your learning streak in the top navigation bar</li>
        </ol>
      </motion.div>
    </div>
  );
};

export default HomePage; 