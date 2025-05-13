import React, { FC } from 'react';
import { FaLightbulb } from 'react-icons/fa';

// --- Interfaces ---

interface EmojiStats {
  [emoji: string]: number;
}

interface SubjectData {
  viewed: number;
  completed: number;
  emojiStats?: EmojiStats;
  daysSinceLastStudy?: number;
  // Add any other fields related to a subject's progress data
}

interface SubjectsData {
  [subject: string]: SubjectData;
}

interface Recommendation {
  type: 'incomplete' | 'needsHelp' | 'inactive' | string; // Allow other string types for extensibility
  message: string;
  priority: number;
}

interface RecommendationStyle {
  bg: string;
  darkBg: string;
  icon: string;
  title: string;
  text: string;
}

interface StudyRecommendationProps {
  subjectsData: SubjectsData | null | undefined;
}

/**
 * Component that provides intelligent study recommendations based on note completions
 */
const StudyRecommendation: FC<StudyRecommendationProps> = ({ subjectsData }) => {
  if (!subjectsData || Object.keys(subjectsData).length === 0) {
    return null; // If no data, don't show any recommendations
  }
  
  const getRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    
    Object.entries(subjectsData).forEach(([subject, data]) => {
      if (data.viewed > 0 && data.completed < data.viewed * 0.5) {
        recommendations.push({
          type: 'incomplete',
          message: `You've viewed ${data.viewed} ${subject} notes but only finished ${data.completed}. Consider completing these notes to improve retention.`,
          priority: 2
        });
      }
    });
    
    Object.entries(subjectsData).forEach(([subject, data]) => {
      const needsHelpCount = data.emojiStats && data.emojiStats['❗'] || 0;
      if (needsHelpCount >= 2) {
        recommendations.push({
          type: 'needsHelp',
          message: `You've marked ${needsHelpCount} ${subject} notes as needing help. Consider seeking assistance from a teacher or tutor.`,
          priority: 3
        });
      }
    });
    
    Object.entries(subjectsData).forEach(([subject, data]) => {
      const daysSinceLastStudy = data.daysSinceLastStudy || 0;
      if (daysSinceLastStudy > 7 && data.completed > 0) {
        recommendations.push({
          type: 'inactive',
          message: `It's been ${daysSinceLastStudy} days since you studied ${subject}. Regular review helps with knowledge retention.`,
          priority: 1
        });
      }
    });
    
    recommendations.sort((a, b) => b.priority - a.priority);
    
    return recommendations;
  };
  
  const recommendations = getRecommendations();
  
  if (recommendations.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-6">
        <div className="flex items-start">
          <FaLightbulb className="text-green-500 dark:text-green-400 mt-1 mr-3" />
          <div>
            <h3 className="font-semibold text-green-700 dark:text-green-300 mb-1">You're on track!</h3>
            <p className="text-green-600 dark:text-green-300">
              Keep up with your studies. You're doing well with completing accessible notes and understanding the material.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const getRecommendationStyle = (type: Recommendation['type']): RecommendationStyle => {
    switch (type) {
      case 'needsHelp':
        return {
          bg: 'bg-red-50',
          darkBg: 'dark:bg-red-900/20',
          icon: 'text-red-500 dark:text-red-400',
          title: 'text-red-700 dark:text-red-300',
          text: 'text-red-600 dark:text-red-300'
        };
      case 'inactive':
        return {
          bg: 'bg-yellow-50',
          darkBg: 'dark:bg-yellow-900/20',
          icon: 'text-yellow-500 dark:text-yellow-400',
          title: 'text-yellow-700 dark:text-yellow-300',
          text: 'text-yellow-600 dark:text-yellow-300'
        };
      case 'incomplete':
      default:
        return {
          bg: 'bg-blue-50',
          darkBg: 'dark:bg-blue-900/20',
          icon: 'text-blue-500 dark:text-blue-400',
          title: 'text-blue-700 dark:text-blue-300',
          text: 'text-blue-600 dark:text-blue-300'
        };
    }
  };
  
  const topRecommendations = recommendations.slice(0, 3);
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Study Recommendations</h2>
      
      {topRecommendations.map((rec, index) => {
        const style = getRecommendationStyle(rec.type);
        
        return (
          <div key={index} className={`${style.bg} ${style.darkBg} p-4 rounded-lg`}>
            <div className="flex items-start">
              <FaLightbulb className={`${style.icon} mt-1 mr-3`} />
              <div>
                <h3 className={`font-semibold ${style.title} mb-1`}>
                  {rec.type === 'needsHelp' ? 'Need Assistance?' : 
                   rec.type === 'inactive' ? 'Time to Review' : 
                   'Complete Your Learning'}
                </h3>
                <p className={style.text}>{rec.message}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StudyRecommendation; 