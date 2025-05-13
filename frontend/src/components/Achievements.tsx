import React from 'react';

// Define the structure for an individual achievement
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon component
  xpReward: number;
  // Add target value if progress is not always 0-100
  // targetValue?: number; 
}

// Define the structure for user-specific achievement progress
interface UserAchievement {
  id: string; // Corresponds to Achievement.id
  progress: number; // Percentage (0-100)
  unlocked: boolean;
  // lastUpdated?: Date;
}

// Props for the Achievements component
interface AchievementsProps {
  userAchievements?: UserAchievement[]; // Make it optional if it can be undefined/null
  // We could also pass the global achievements list as a prop if it's dynamic
}

// Predefined list of all possible achievements
const allAchievements: Achievement[] = [
  {
    id: 'first_note',
    name: 'First Note Uploaded',
    description: 'Successfully upload your first study note to the platform.',
    icon: '📝',
    xpReward: 100
  },
  {
    id: 'note_collector',
    name: 'Note Collector',
    description: 'Upload a total of 10 study notes.',
    icon: '📚',
    xpReward: 500
  },
  {
    id: 'helpful_contributor',
    name: 'Helpful Contributor',
    description: 'Receive 10 upvotes or positive ratings on your notes.',
    icon: '⭐',
    xpReward: 300
  },
  {
    id: 'flashcard_master',
    name: 'Flashcard Master',
    description: 'Generate and study with 20 unique flashcards.',
    icon: '🎯',
    xpReward: 400
  },
  {
    id: 'streak_warrior',
    name: 'Streak Warrior',
    description: 'Maintain a consistent 7-day study streak.',
    icon: '🔥',
    xpReward: 200
  },
  {
    id: 'knowledge_sharer',
    name: 'Knowledge Sharer',
    description: 'Share notes across 3 or more different subjects.',
    icon: '🌍',
    xpReward: 600
  },
  {
    id: 'community_builder',
    name: 'Community Builder',
    description: 'Participate in 5 study groups or collaborative sessions.',
    icon: '🤝',
    xpReward: 350
  },
  {
    id: 'top_learner',
    name: 'Top Learner',
    description: 'Reach the top 10 on the weekly leaderboard.',
    icon: '🏆',
    xpReward: 750
  }
];

const Achievements: React.FC<AchievementsProps> = ({ userAchievements = [] }) => {
  
  const getAchievementData = (achievementId: string): UserAchievement | undefined => {
    return userAchievements.find(a => a.id === achievementId);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Achievements</h2>
      {allAchievements.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">No achievements available at the moment. Check back soon!</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allAchievements.map(achievement => {
          const userData = getAchievementData(achievement.id);
          const progress = userData?.progress ?? 0;
          const unlocked = userData?.unlocked ?? false;

          return (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border transition-all duration-300 ease-in-out 
                ${unlocked 
                  ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 shadow-lg' 
                  : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`text-3xl p-2 rounded-full ${unlocked ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-600'}`}>{achievement.icon}</div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg ${unlocked ? 'text-green-700 dark:text-green-300' : 'text-gray-800 dark:text-gray-100'}`}>{achievement.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    {achievement.description}
                  </p>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex-1 mr-4">
                      <div className={`w-full rounded-full h-2.5 ${unlocked ? 'bg-green-200 dark:bg-green-700' : 'bg-gray-200 dark:bg-gray-600'}`}>
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ease-out 
                            ${unlocked ? 'bg-green-500 dark:bg-green-400' : 'bg-blue-500 dark:bg-blue-400'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {unlocked ? (
                        <span className="text-green-600 dark:text-green-300 font-semibold">Unlocked!</span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">{progress}%</span>
                      )}
                    </div>
                  </div>
                  <div className={`mt-1 text-xs font-medium ${unlocked ? 'text-green-500 dark:text-green-400' : 'text-blue-500 dark:text-blue-400'}`}>
                    Reward: {achievement.xpReward} XP
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements; 