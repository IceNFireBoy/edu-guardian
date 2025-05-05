import React from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaArrowRight, FaCalendarCheck, FaTrophy, FaChartLine, FaRegClock } from 'react-icons/fa';

/**
 * Component that shows personalized weekly motivation cards
 */
const MotivationCards = ({ progressData }) => {
  if (!progressData) {
    return null;
  }
  
  // Generate motivation cards based on user progress
  const generateMotivationCards = () => {
    const cards = [];
    
    // Weekly completion card
    if (progressData.completedThisWeek > 0) {
      cards.push({
        title: '🌟 Great Progress!',
        message: `You've completed ${progressData.completedThisWeek} ${progressData.completedThisWeek === 1 ? 'note' : 'notes'} this week!`,
        icon: <FaStar className="text-yellow-400" />,
        color: 'bg-yellow-50 dark:bg-yellow-900/20',
        textColor: 'text-yellow-700 dark:text-yellow-300',
        iconBackground: 'bg-yellow-100 dark:bg-yellow-800/50'
      });
    }
    
    // Subject inactivity card
    if (progressData.inactiveSubjects && progressData.inactiveSubjects.length > 0) {
      const subject = progressData.inactiveSubjects[0];
      cards.push({
        title: '🔁 Time to Review',
        message: `You haven't studied ${subject.name} in ${subject.days} days.`,
        icon: <FaRegClock className="text-blue-400" />,
        color: 'bg-blue-50 dark:bg-blue-900/20',
        textColor: 'text-blue-700 dark:text-blue-300',
        iconBackground: 'bg-blue-100 dark:bg-blue-800/50'
      });
    }
    
    // Streak card
    if (progressData.currentStreak > 0) {
      cards.push({
        title: '🔥 Keep the Streak Going!',
        message: `You're on a ${progressData.currentStreak}-day study streak!`,
        icon: <FaChartLine className="text-orange-400" />,
        color: 'bg-orange-50 dark:bg-orange-900/20',
        textColor: 'text-orange-700 dark:text-orange-300',
        iconBackground: 'bg-orange-100 dark:bg-orange-800/50'
      });
    }
    
    // Achievement card
    if (progressData.totalCompletedNotes > 0 && progressData.totalCompletedNotes % 10 === 0) {
      cards.push({
        title: '🏆 Milestone Reached!',
        message: `You've completed ${progressData.totalCompletedNotes} notes in total.`,
        icon: <FaTrophy className="text-purple-400" />,
        color: 'bg-purple-50 dark:bg-purple-900/20',
        textColor: 'text-purple-700 dark:text-purple-300',
        iconBackground: 'bg-purple-100 dark:bg-purple-800/50'
      });
    }
    
    // Subject completion card
    if (progressData.subjectProgress) {
      const completedSubjects = Object.entries(progressData.subjectProgress)
        .filter(([_, data]) => data.percentage >= 75);
      
      if (completedSubjects.length > 0) {
        const [subject, data] = completedSubjects[0];
        cards.push({
          title: '📚 Almost There!',
          message: `You've completed ${data.percentage}% of your ${subject} notes.`,
          icon: <FaCalendarCheck className="text-green-400" />,
          color: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-700 dark:text-green-300',
          iconBackground: 'bg-green-100 dark:bg-green-800/50'
        });
      }
    }
    
    // Default card if nothing else applies
    if (cards.length === 0) {
      cards.push({
        title: '📝 Start Your Study Journey',
        message: 'Mark notes as complete to track your progress and get personalized insights.',
        icon: <FaArrowRight className="text-indigo-400" />,
        color: 'bg-indigo-50 dark:bg-indigo-900/20',
        textColor: 'text-indigo-700 dark:text-indigo-300',
        iconBackground: 'bg-indigo-100 dark:bg-indigo-800/50'
      });
    }
    
    return cards;
  };
  
  const motivationCards = generateMotivationCards();
  
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Weekly Motivation</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {motivationCards.map((card, index) => (
          <motion.div 
            key={index}
            className={`${card.color} p-4 rounded-lg shadow-sm`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex items-start">
              <div className={`p-3 rounded-full ${card.iconBackground} mr-3`}>
                {card.icon}
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${card.textColor} mb-1`}>
                  {card.title}
                </h3>
                <p className={card.textColor}>
                  {card.message}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MotivationCards; 