import React, { useState, useEffect, FC, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaFire, FaStar, FaBook, FaCalendarAlt, FaUsers, FaChartBar, FaSpinner } from 'react-icons/fa'; // Added more icons and FaSpinner
import { useUser } from '../features/user/useUser';

import SubjectCard from '../components/progress/SubjectCard'; // Already TSX
import StudyRecommendation from '../components/progress/StudyRecommendation'; // Already TSX
import FocusBar from '../components/progress/FocusBar'; // Already TSX
import MotivationCards from '../components/progress/MotivationCards'; // Already TSX

// --- Interfaces and Types ---

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string; // Tailwind text color class, e.g., 'text-blue-500'
}

interface StoredNoteFeedback {
  emoji: string;
  timestamp: string; // ISO Date string
}

interface StoredCompletedNote {
  id: string; // Corresponds to Note._id or Note.asset_id
  title?: string;
  subject?: string;
  completedAt: string; // ISO Date string
  timeSpent: number; // in minutes typically
  feedback?: string; // Emoji string e.g. "🤓"
  // Deprecated feedback storage
  feedbacks?: StoredNoteFeedback[]; // Array of feedback objects
}

interface StoredNote {
  _id: string;
  asset_id?: string;
  title?: string;
  subject?: string;
  secure_url?: string;
  fileUrl?: string;
  url?: string;
  // other fields from actual note structure
}

interface SubjectEmojiStats {
  [emoji: string]: number;
}

interface SubjectProgressDetail {
  completed: number;
  total: number;
  timeSpent: number; // in minutes
  avgTime: string; // Formatted string e.g., "30 min"
  emojiStats: SubjectEmojiStats;
  lastStudied: Date | null;
  daysSinceLastStudy?: number;
  percentage: number;
}

interface SubjectsData {
  [subject: string]: SubjectProgressDetail;
}

interface SubjectTimeData { // For FocusBar
  [subject: string]: number; // timeSpent in minutes
}

interface InactiveSubjectInfo {
  name: string;
  days: number;
}

interface ProgressPageData {
  subjectsData: SubjectsData;
  subjectTimeData: SubjectTimeData;
  inactiveSubjects: InactiveSubjectInfo[];
  completedThisWeek: number;
  totalCompletedNotes: number;
  currentStreak: number; // From useStreak
  xp?: number; // From useStreak
  xpForNextLevel?: number; // From useStreak
  subjectProgress: SubjectsData; // Duplicates subjectsData with percentage, could be merged
}

// Assumed return from useStreak hook (adjust if useStreak.ts provides specific types)
interface AssumedStreakData {
  currentStreak: number;
  xp: number;
  level?: number; // Optional
  // ... other streak fields
}
interface AssumedUseStreakReturn {
  streak: AssumedStreakData;
  getXpForNextLevel: () => number;
  // ... other methods/properties from useStreak
}

// --- Components ---

const StatsCard: FC<StatsCardProps> = ({ title, value, icon, color }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-center"
  >
    <div className={`p-3 rounded-full ${color.replace('text-', 'bg-')}/10 mr-3`}> {/* Basic color conversion */}
      {icon}
    </div>
    <div>
      <h3 className="text-gray-500 dark:text-gray-400 text-sm">{title}</h3>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  </motion.div>
);

const Progress: FC = () => {
  const { profile, loading } = useUser();
  const [progressData, setProgressData] = useState<ProgressPageData | null>(null);

  useEffect(() => {
    if (!profile) return;
    // Use backend data from profile instead of localStorage
    const subjectDataMap: SubjectsData = {};
    const now = new Date();
    const validNotesBySubject: { [subject: string]: StoredNote[] } = {};

    // Assume profile.notes contains all notes and profile.completedNotes contains completed notes
    const allNotes: StoredNote[] = profile.notes || [];
    const completedNotes: StoredCompletedNote[] = profile.completedNotes || [];

    allNotes.forEach(note => {
      const noteUrl = note.secure_url || note.fileUrl || note.url || '';
      const hasValidUrl = typeof noteUrl === 'string' && noteUrl.trim() !== '' && (noteUrl.startsWith('http://') || noteUrl.startsWith('https://'));
      if (!hasValidUrl) return;

      let subject = note.subject || 'Uncategorized';
      // Basic subject detection from title (could be improved)
      if (note.title) {
        if (note.title.toLowerCase().includes('biology')) subject = 'Biology';
        else if (note.title.toLowerCase().includes('math')) subject = 'Mathematics'; // Example
      }
      if (!validNotesBySubject[subject]) validNotesBySubject[subject] = [];
      validNotesBySubject[subject].push(note);
    });

    Object.entries(validNotesBySubject).forEach(([subject, notesInSubject]) => {
      subjectDataMap[subject] = {
        completed: 0,
        total: notesInSubject.length,
        timeSpent: 0,
        avgTime: '0 min',
        emojiStats: { "🤓": 0, "🤔": 0, "❗": 0 },
        lastStudied: null,
        percentage: 0,
      };
    });

    completedNotes.forEach(completedNote => {
      let subject = completedNote.subject || 'Uncategorized';
      if (subject.includes('Biology')) subject = 'Biology'; // Normalize

      if (!subjectDataMap[subject] || !validNotesBySubject[subject]) return;

      const isValidCompletion = validNotesBySubject[subject].some(validNote => 
        validNote._id === completedNote.id || validNote.asset_id === completedNote.id
      );
      if (!isValidCompletion) return;

      subjectDataMap[subject].completed++;
      subjectDataMap[subject].timeSpent += completedNote.timeSpent || 0;
      if (completedNote.feedback && subjectDataMap[subject].emojiStats[completedNote.feedback] !== undefined) {
        subjectDataMap[subject].emojiStats[completedNote.feedback]++;
      }
      if (completedNote.completedAt) {
        const completedDate = new Date(completedNote.completedAt);
        if (!subjectDataMap[subject].lastStudied || completedDate > (subjectDataMap[subject].lastStudied as Date)) {
          subjectDataMap[subject].lastStudied = completedDate;
        }
      }
    });

    Object.keys(subjectDataMap).forEach(subject => {
      const data = subjectDataMap[subject];
      data.avgTime = data.completed > 0 ? `${Math.round(data.timeSpent / data.completed)} min` : '0 min';
      if (data.lastStudied) {
        const diffTime = Math.abs(now.getTime() - (data.lastStudied as Date).getTime());
        data.daysSinceLastStudy = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      data.percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
    });

    const inactiveSubjects: InactiveSubjectInfo[] = Object.entries(subjectDataMap)
      .filter(([_, data]) => data.completed > 0 && (data.daysSinceLastStudy || 0) > 7)
      .map(([subjectName, data]) => ({ name: subjectName, days: data.daysSinceLastStudy || 0 }))
      .sort((a, b) => b.days - a.days);

    const subjectTimeData: SubjectTimeData = {};
    Object.entries(subjectDataMap).forEach(([subjectName, data]) => {
      if (data.timeSpent > 0) subjectTimeData[subjectName] = data.timeSpent;
    });

    const completedThisWeek = completedNotes.filter(note => {
      if (!note.completedAt) return false;
      const completedDate = new Date(note.completedAt);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return completedDate >= oneWeekAgo;
    }).length;

    setProgressData({
      subjectsData: subjectDataMap,
      subjectTimeData,
      inactiveSubjects,
      completedThisWeek,
      totalCompletedNotes: completedNotes.length,
      currentStreak: profile.streak?.current || 0,
      xp: profile.xp,
      xpForNextLevel: profile.xpForNextLevel,
      subjectProgress: subjectDataMap,
    });
  }, [profile]);

  // Demo data generation needs to accept streak data
  const getDemoProgressData = (currentStreakData: AssumedStreakData, currentGetXpForNextLevel: () => number): ProgressPageData => {
    const demoSubjects: SubjectsData = {
      'Mathematics': { completed: 8, total: 12, timeSpent: 240, avgTime: '30 min', emojiStats: { "🤓": 5, "🤔": 2, "❗": 1 }, lastStudied: new Date(Date.now() - 2 * 24*60*60*1000), daysSinceLastStudy: 2, percentage: 67 },
      'Physics': { completed: 5, total: 10, timeSpent: 150, avgTime: '30 min', emojiStats: { "🤓": 2, "🤔": 2, "❗": 1 }, lastStudied: new Date(Date.now() - 4 * 24*60*60*1000), daysSinceLastStudy: 4, percentage: 50 },
      'Chemistry': { completed: 3, total: 8, timeSpent: 75, avgTime: '25 min', emojiStats: { "🤓": 1, "🤔": 1, "❗": 1 }, lastStudied: new Date(Date.now() - 10 * 24*60*60*1000), daysSinceLastStudy: 10, percentage: 38 },
    };
    return {
      subjectsData: demoSubjects,
      subjectTimeData: { 'Mathematics': 240, 'Physics': 150, 'Chemistry': 75 },
      inactiveSubjects: [{ name: 'Chemistry', days: 10 }],
      completedThisWeek: 5,
      totalCompletedNotes: 16,
      currentStreak: currentStreakData.currentStreak,
      xp: currentStreakData.xp,
      xpForNextLevel: currentGetXpForNextLevel(),
      subjectProgress: demoSubjects,
    };
  };

  if (loading || !progressData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        {/* Add a proper loading spinner component here if available */}
        <FaSpinner className="animate-spin text-4xl text-primary" />
      </div>
    );
  }

  const { 
    subjectsData,
    subjectTimeData,
    inactiveSubjects, 
    completedThisWeek, 
    totalCompletedNotes, 
    currentStreak,
    xp,
    xpForNextLevel,
  } = progressData;

  const overallProgressPercent = totalCompletedNotes > 0 
    ? Math.round((totalCompletedNotes / (Object.values(subjectsData).reduce((sum, s) => sum + s.total, 0) || 1)) * 100) 
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-8 space-y-8"
    >
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Your Progress</h1>
      </header>

      {/* Overall Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Current Streak" value={`${currentStreak} days`} icon={<FaFire size={24} className="text-orange-500" />} color="text-orange-500" />
        <StatsCard title="Total XP" value={`${xp || 0} XP`