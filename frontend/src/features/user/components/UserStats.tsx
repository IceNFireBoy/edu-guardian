interface UserStatsProps {
  userData: {
    xp: number;
    level: number;
    streak: {
      current: number;
      max: number;
      lastUsed: string;
    };
    aiUsage: {
      summaryUsed: number;
      flashcardUsed: number;
      lastReset: string;
    };
  };
} 