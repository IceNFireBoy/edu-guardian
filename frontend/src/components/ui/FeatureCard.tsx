import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  to: string;
  color: string; // Tailwind class string for border color e.g. "border-primary"
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, to, color }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border-t-4 ${color}`}
  >
    <div className="flex items-center mb-4">
      <div className={`p-3 rounded-full ${color.replace('border-', 'bg-')} bg-opacity-10`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold ml-3 text-gray-900 dark:text-white">{title}</h3>
    </div>
    <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>
    <Link to={to} className="text-primary font-medium hover:underline">
      Explore →
    </Link>
  </motion.div>
);

export default FeatureCard; 