import React, { useState, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaUpload, FaSearch, FaChartLine, FaSpinner, FaFire, FaStar, FaBook,
  FaClock, FaPlay, FaArrowRight
} from 'react-icons/fa';
import DashboardFeed from '../features/dashboard/DashboardFeed';
import { useUser } from '../features/user/useUser';
import { useNote } from '../features/notes/useNote';
import { useStreak } from '../hooks/useStreak';
import { getSubjectColor } from '../features/notes/NoteCard';
import type { Note } from '../types/note';

const greetingForHour = (hour: number): string => {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

interface StatTileProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tint: string; // e.g. 'bg-amber-50 dark:bg-amber-900/20'
  sub?: ReactNode;
}

const StatTile: React.FC<StatTileProps> = ({ label, value, icon, tint, sub }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-200 dark:border-slate-700 p-4 flex flex-col"
  >
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`p-2 rounded-xl ${tint}`}>{icon}</span>
    </div>
    <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
    {sub && <div className="mt-auto pt-2">{sub}</div>}
  </motion.div>
);

const formatStudyTime = (totalSeconds: number): string => {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const HomePage: React.FC = () => {
  const { profile, loading } = useUser();
  const { fetchNotes } = useNote();
  const { getXpForNextLevel } = useStreak();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await fetchNotes({ sortBy: 'date', sortOrder: 'desc' } as any);
        if (mounted && response?.data) setNotes(response.data);
      } catch {
        /* the feed and tiles still render without notes */
      }
    })();
    return () => { mounted = false; };
  }, [fetchNotes]);

  if (loading && !profile) {
    return (
      <div className="p-12 flex items-center justify-center text-gray-600 dark:text-gray-300">
        <FaSpinner className="animate-spin text-primary mr-3" size={24} />
        <span>Loading your dashboard...</span>
      </div>
    );
  }

  const firstName = (profile?.name || profile?.username || 'there').split(' ')[0];
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const studiedNotes = profile?.studiedNotes ?? [];
  const totalStudySeconds = studiedNotes.reduce((sum, sn) => sum + (sn.totalSeconds || 0), 0);
  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const xpToNext = getXpForNextLevel();
  const xpProgressPct = xpToNext > 0 ? Math.min(100, Math.round((xp / (xp + xpToNext)) * 100)) : 100;

  // Continue studying: the most recently studied note, if it still exists
  const lastStudied = [...studiedNotes].sort(
    (a, b) => new Date(b.lastStudiedAt).getTime() - new Date(a.lastStudiedAt).getTime()
  )[0];
  const continueNote = lastStudied ? notes.find(n => n._id === lastStudied.note) : undefined;

  const recentNotes = notes.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {greetingForHour(new Date().getHours())}, {firstName} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{today}</p>
        </div>
        <Link
          to="/notes"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-dark hover:to-indigo-700 shadow-card transition-all w-fit"
        >
          <FaSearch /> Browse Notes
        </Link>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label={`Level ${level}`}
          value={`${xp} XP`}
          icon={<FaStar className="text-primary" />}
          tint="bg-primary-50 dark:bg-primary-900/20"
          sub={
            <div>
              <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-700"
                  style={{ width: `${xpProgressPct}%` }}
                />
              </div>
              {xpToNext > 0 && (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{xpToNext} XP to level {level + 1}</p>
              )}
            </div>
          }
        />
        <StatTile
          label="Day Streak"
          value={`${profile?.streak?.current ?? 0}`}
          icon={<FaFire className="text-accent" />}
          tint="bg-amber-50 dark:bg-amber-900/20"
          sub={<p className="text-[11px] text-gray-400 dark:text-gray-500">best: {profile?.streak?.max ?? 0} days</p>}
        />
        <StatTile
          label="Notes Studied"
          value={`${studiedNotes.length}`}
          icon={<FaBook className="text-emerald-500" />}
          tint="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <StatTile
          label="Study Time"
          value={formatStudyTime(totalStudySeconds)}
          icon={<FaClock className="text-sky-500" />}
          tint="bg-sky-50 dark:bg-sky-900/20"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Continue studying */}
          {continueNote && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl shadow-card border border-primary-200 dark:border-primary-800/50 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 p-5"
            >
              <p className="text-xs font-semibold tracking-wide text-primary-dark dark:text-primary-light mb-2">CONTINUE STUDYING</p>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">{continueNote.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    <span className={`${getSubjectColor(continueNote.subject).text} ${getSubjectColor(continueNote.subject).darkText} font-medium`}>
                      {continueNote.subject}
                    </span>
                    {' '}&middot; studied {lastStudied!.timesStudied}&times; &middot; {formatStudyTime(lastStudied!.totalSeconds)} total
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/view-note/${continueNote._id}`)}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-dark hover:to-indigo-700 transition-all"
                >
                  <FaPlay className="text-sm" /> Resume
                </button>
              </div>
            </motion.div>
          )}

          {/* Recent notes */}
          {recentNotes.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-200 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Notes</h2>
                <Link to="/notes" className="text-sm font-medium text-primary dark:text-primary-light hover:underline inline-flex items-center gap-1">
                  View all <FaArrowRight className="text-xs" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentNotes.map(note => {
                  const theme = getSubjectColor(note.subject);
                  return (
                    <button
                      key={note._id}
                      onClick={() => navigate(`/view-note/${note._id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-card transition-all text-left"
                    >
                      <span className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${theme.light} ${theme.dark}`}>
                        <FaBook className={`${theme.text} ${theme.darkText}`} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-sm text-gray-900 dark:text-white truncate">{note.title}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">{note.subject}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity feed */}
          <DashboardFeed />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h2>

          {[
            { icon: <FaUpload className="text-primary" size={20} />, title: 'Upload Notes', description: 'Share your knowledge with other students.', to: '/notes/upload', tint: 'bg-primary-50 dark:bg-primary-900/20' },
            { icon: <FaSearch className="text-emerald-500" size={20} />, title: 'Find Study Material', description: 'Filter notes by subject, grade and quarter.', to: '/notes', tint: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { icon: <FaChartLine className="text-accent" size={20} />, title: 'Track Progress', description: 'XP, streaks and per-subject progress.', to: '/progress', tint: 'bg-amber-50 dark:bg-amber-900/20' }
          ].map((action, index) => (
            <motion.div
              key={action.to}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <Link
                to={action.to}
                className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-200 dark:border-slate-700 hover:shadow-card-hover hover:border-primary-300 dark:hover:border-primary-700 transition-all"
              >
                <div className={`p-3 rounded-xl mr-4 ${action.tint}`}>{action.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{action.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{action.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}

          <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-2xl p-5 text-white shadow-card">
            <h3 className="font-semibold text-lg mb-1.5">Did You Know?</h3>
            <p className="text-sm text-primary-100">
              You earn XP and badges by uploading notes, studying regularly and keeping your streak alive. Check your{' '}
              <Link to="/badges" className="font-semibold underline hover:text-white">badges</Link>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
