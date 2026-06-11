import React, { useState, useEffect, FC, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaFire, FaStar, FaBook, FaClock, FaSpinner, FaBookOpen } from 'react-icons/fa';
import { useUser } from '../features/user/useUser';
import { useNote } from '../features/notes/useNote';
import { useStreak } from '../hooks/useStreak';
import { getSubjectColor } from '../features/notes/NoteCard';
import FocusBar from '../components/progress/FocusBar';
import type { Note } from '../types/note';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string; // Tailwind text color class, e.g. 'text-orange-500'
}

const StatsCard: FC<StatsCardProps> = ({ title, value, icon, color }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex items-center"
  >
    <div className={`p-3 rounded-full ${color.replace('text-', 'bg-')}/10 mr-3`}>
      {icon}
    </div>
    <div>
      <h3 className="text-gray-500 dark:text-gray-400 text-sm">{title}</h3>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  </motion.div>
);

interface SubjectProgress {
  subject: string;
  studied: number;
  total: number;
  percentage: number;
  minutes: number;
}

const formatMinutes = (totalSeconds: number): string => {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

const Progress: FC = () => {
  const { profile, loading: profileLoading } = useUser();
  const { fetchNotes } = useNote();
  const { getXpForNextLevel } = useStreak();
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await fetchNotes({} as any);
        if (mounted && response?.data) setNotes(response.data);
      } finally {
        if (mounted) setNotesLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [fetchNotes]);

  if (profileLoading || notesLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <FaSpinner className="animate-spin text-4xl text-primary" />
      </div>
    );
  }

  const studiedNotes = profile.studiedNotes ?? [];
  const studiedIds = new Set(studiedNotes.map(sn => sn.note));
  const totalStudySeconds = studiedNotes.reduce((sum, sn) => sum + (sn.totalSeconds || 0), 0);

  // Join the user's studied records with the note catalogue per subject
  const bySubject = new Map<string, SubjectProgress>();
  notes.forEach(note => {
    const subject = note.subject || 'Uncategorized';
    const entry = bySubject.get(subject) ?? { subject, studied: 0, total: 0, percentage: 0, minutes: 0 };
    entry.total += 1;
    if (studiedIds.has(note._id)) {
      entry.studied += 1;
      const record = studiedNotes.find(sn => sn.note === note._id);
      entry.minutes += Math.round((record?.totalSeconds || 0) / 60);
    }
    bySubject.set(subject, entry);
  });
  const subjectProgress = [...bySubject.values()]
    .map(entry => ({ ...entry, percentage: entry.total > 0 ? Math.round((entry.studied / entry.total) * 100) : 0 }))
    .sort((a, b) => b.percentage - a.percentage);

  const subjectTimeData = Object.fromEntries(
    subjectProgress.filter(s => s.minutes > 0).map(s => [s.subject, s.minutes])
  );

  const xp = profile.xp ?? 0;
  const xpForNextLevel = getXpForNextLevel();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Your Progress</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Level {profile.level ?? 1} &middot; {xp} XP{xpForNextLevel > 0 && ` · ${xpForNextLevel} XP to next level`}
        </p>
      </header>

      {/* Overall stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard title="Current Streak" value={`${profile.streak?.current ?? 0} days`} icon={<FaFire size={22} className="text-orange-500" />} color="text-orange-500" />
        <StatsCard title="Total XP" value={xp} icon={<FaStar size={22} className="text-amber-500" />} color="text-amber-500" />
        <StatsCard title="Notes Studied" value={studiedNotes.length} icon={<FaBook size={22} className="text-violet-500" />} color="text-violet-500" />
        <StatsCard title="Study Time" value={formatMinutes(totalStudySeconds)} icon={<FaClock size={22} className="text-sky-500" />} color="text-sky-500" />
      </section>

      {/* Per-subject progress */}
      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Progress by Subject</h2>
        {subjectProgress.length === 0 ? (
          <div className="text-center py-10">
            <FaBookOpen className="text-4xl text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No notes yet — once notes exist and you study them, your per-subject progress shows up here.</p>
            <Link to="/notes" className="btn btn-primary inline-block">Browse Notes</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {subjectProgress.map(({ subject, studied, total, percentage, minutes }) => {
              const theme = getSubjectColor(subject);
              return (
                <div key={subject}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={`font-medium ${theme.text} ${theme.darkText}`}>{subject}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {studied}/{total} studied{minutes > 0 && ` · ${minutes} min`}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${theme.bg} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Where the study time goes */}
      {Object.keys(subjectTimeData).length > 0 && (
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Focus Distribution</h2>
          <FocusBar subjectTimeData={subjectTimeData} />
        </section>
      )}
    </motion.div>
  );
};

export default Progress;
