import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Award, Loader2 } from 'lucide-react';
import apiClient from '../api/apiClient';

interface LeaderboardEntry {
  rank: number;
  _id: string;
  username: string;
  name: string;
  profileImage: string;
  level: number;
  xp: number;
  currentStreak: number;
  badgeCount: number;
}

const medal = ['🥇', '🥈', '🥉'];

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get('/users/leaderboard?limit=50')
      .then((res) => {
        if (mounted) setEntries(res.data?.data ?? []);
      })
      .catch(() => {
        if (mounted) setError('Could not load the leaderboard. Please try again.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading leaderboard…
      </div>
    );
  }

  if (error) {
    return <div data-testid="leaderboard-error" className="text-center py-16 text-red-500">{error}</div>;
  }

  return (
    <div data-testid="leaderboard" className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-7 h-7 text-yellow-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
      </div>

      {entries.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No learners ranked yet — start earning XP!</p>
      ) : (
        <ol className="space-y-2">
          {entries.map((e, i) => (
            <motion.li
              key={e._id}
              data-testid={`leaderboard-row-${e.rank}`}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.6) }}
              className={`flex items-center gap-4 p-3 rounded-lg border ${
                e.rank <= 3
                  ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50/60 dark:bg-yellow-900/10'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <span className="w-8 text-center text-lg font-bold text-gray-500">
                {medal[e.rank - 1] ?? e.rank}
              </span>
              {e.profileImage && /^https?:\/\//.test(e.profileImage) ? (
                <img src={e.profileImage} alt={e.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  {(e.name || e.username || '?').charAt(0).toUpperCase()}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{e.name || e.username}</p>
                <p className="text-xs text-gray-500">Level {e.level}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold text-primary">{e.xp} XP</span>
                <span className="hidden sm:flex items-center gap-1 text-orange-500">
                  <Flame className="w-4 h-4" /> {e.currentStreak}
                </span>
                <span className="hidden sm:flex items-center gap-1 text-yellow-600">
                  <Award className="w-4 h-4" /> {e.badgeCount}
                </span>
              </div>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default Leaderboard;
