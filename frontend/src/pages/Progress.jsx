import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaFire, FaStar, FaBook, FaCalendarAlt } from 'react-icons/fa';
import { useStreak } from '../hooks/useStreak';

// Import our new components
import SubjectCard from '../components/progress/SubjectCard';
import StudyRecommendation from '../components/progress/StudyRecommendation';
import FocusBar from '../components/progress/FocusBar';
import MotivationCards from '../components/progress/MotivationCards';

// Stats Card component (keeping from the original)
const StatsCard = ({ title, value, icon, color }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-center"
  >
    <div className={`p-3 rounded-full ${color.replace('text', 'bg')}/10 mr-3`}>
      {icon}
    </div>
    <div>
      <h3 className="text-gray-500 dark:text-gray-400 text-sm">{title}</h3>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  </motion.div>
);

const Progress = () => {
  // Get streak and XP from useStreak hook
  const { streak: streakData, getXpForNextLevel } = useStreak();
  const [progressData, setProgressData] = useState(null);
  
  // Load progress data from localStorage on component mount
  useEffect(() => {
    // Load completion data
    const loadProgressData = () => {
      try {
        // Get completed notes from localStorage
        const completedNotes = JSON.parse(localStorage.getItem('completedNotes') || '[]');
        
        // Get all notes for reference
        const allNotes = JSON.parse(localStorage.getItem('notes') || '[]');
        
        // Calculate completion data by subject
        const subjectData = {};
        const now = new Date();
        
        // Create a mapping of valid notes for each subject
        const validNotesBySubject = {};
        
        // First identify valid notes by URL and categorize them by subject
        allNotes.forEach(note => {
          // Validate URL - must be non-empty and start with http:// or https://
          const noteUrl = note.secure_url || note.fileUrl || note.url || '';
          const hasValidUrl = typeof noteUrl === 'string' && 
                              noteUrl.trim() !== '' && 
                              (noteUrl.startsWith('http://') || noteUrl.startsWith('https://'));
          
          if (!hasValidUrl) {
            return; // Skip notes with invalid URLs
          }
          
          // Attempt to detect subject from note title if not explicitly set
          let subject = note.subject || 'Uncategorized';
          
          // Check if title contains a subject
          if (note.title) {
            if (note.title.includes('Biology') || note.title.toLowerCase().includes('biology')) {
              subject = 'Biology';
            }
          }
          
          // Initialize subject array if needed
          if (!validNotesBySubject[subject]) {
            validNotesBySubject[subject] = [];
          }
          
          // Add this valid note to its subject category
          validNotesBySubject[subject].push(note);
        });
        
        // Initialize subjectData with valid total counts
        Object.entries(validNotesBySubject).forEach(([subject, notes]) => {
          subjectData[subject] = {
            completed: 0,
            total: notes.length, // Set total to the count of valid notes for this subject
            timeSpent: 0,
            emojiStats: { "🤓": 0, "🤔": 0, "❗": 0 },
            lastStudied: null
          };
        });
        
        // Now process completed notes
        completedNotes.forEach(note => {
          // Standardize subject names
          let subject = note.subject || 'Uncategorized';
          
          // Handle "Biology 12" and similar variants
          if (subject.includes('Biology') || subject === 'Biology 12') {
            subject = 'Biology';
          }
          
          // Skip if we don't have this subject in our valid notes
          if (!subjectData[subject]) {
            return;
          }
          
          // Check if this note id exists in our valid notes for this subject
          let isValidNote = false;
          
          // If we have valid notes for this subject
          if (validNotesBySubject[subject]) {
            // Check if this completed note corresponds to a valid note
            isValidNote = validNotesBySubject[subject].some(validNote => 
              validNote._id === note.id || validNote.asset_id === note.id
            );
          }
          
          // Only count completions for valid notes
          if (!isValidNote) {
            return; // Skip this completion
          }
          
          // Increment completed count
          subjectData[subject].completed++;
          
          // Add time spent
          subjectData[subject].timeSpent += note.timeSpent || 0;
          
          // Track feedback
          if (note.feedback) {
            subjectData[subject].emojiStats[note.feedback] = 
              (subjectData[subject].emojiStats[note.feedback] || 0) + 1;
          }
          
          // Track last study date
          if (note.completedAt) {
            const completedDate = new Date(note.completedAt);
            if (!subjectData[subject].lastStudied || completedDate > subjectData[subject].lastStudied) {
              subjectData[subject].lastStudied = completedDate;
            }
          }
        });
        
        // Calculate average time and days since last study
        Object.keys(subjectData).forEach(subject => {
          const data = subjectData[subject];
          
          // Calculate average time per note based on all completed notes
          data.avgTime = data.completed > 0 
            ? `${Math.round(data.timeSpent / data.completed)} min`
            : '0 min';
            
          // Calculate days since last study
          if (data.lastStudied) {
            const diffTime = Math.abs(now - data.lastStudied);
            data.daysSinceLastStudy = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        });
        
        // Calculate inactive subjects (not studied in the last 7 days)
        const inactiveSubjects = Object.entries(subjectData)
          .filter(([_, data]) => data.completed > 0 && data.daysSinceLastStudy > 7)
          .map(([subject, data]) => ({
            name: subject,
            days: data.daysSinceLastStudy
          }))
          .sort((a, b) => b.days - a.days);
        
        // Calculate total time spent per subject for focus bar
        const subjectTimeData = {};
        Object.entries(subjectData).forEach(([subject, data]) => {
          if (data.timeSpent > 0) {
            subjectTimeData[subject] = data.timeSpent;
          }
        });
        
        // Calculate completed notes this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const completedThisWeek = completedNotes.filter(note => {
          if (!note.completedAt) return false;
          const completedDate = new Date(note.completedAt);
          return completedDate >= oneWeekAgo;
        }).length;
        
        // Assemble progress data
        setProgressData({
          subjectsData: subjectData,
          subjectTimeData,
          inactiveSubjects,
          completedThisWeek,
          totalCompletedNotes: completedNotes.length,
          currentStreak: streakData.currentStreak,
          subjectProgress: Object.fromEntries(
            Object.entries(subjectData).map(([subject, data]) => [
              subject,
              {
                ...data,
                percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
              }
            ])
          )
        });
        
      } catch (error) {
        console.error('Error loading progress data:', error);
        // Create fallback demo data if loading fails
        setProgressData(getDemoProgressData());
      }
    };
    
    loadProgressData();
  }, [streakData]);
  
  // Demo data for testing/development
  const getDemoProgressData = () => {
    return {
      subjectsData: {
        'Mathematics': {
          completed: 8,
          total: 12,
          timeSpent: 240,
          avgTime: '30 min',
          emojiStats: { "🤓": 5, "🤔": 2, "❗": 1 },
          daysSinceLastStudy: 2
        },
        'Physics': {
          completed: 5,
          total: 10,
          timeSpent: 150,
          avgTime: '30 min',
          emojiStats: { "🤓": 2, "🤔": 2, "❗": 1 },
          daysSinceLastStudy: 4
        },
        'Chemistry': {
          completed: 3,
          total: 8,
          timeSpent: 75,
          avgTime: '25 min',
          emojiStats: { "🤓": 1, "🤔": 1, "❗": 1 },
          daysSinceLastStudy: 10
        },
        'Biology': {
          completed: 7,
          total: 9,
          timeSpent: 210,
          avgTime: '30 min',
          emojiStats: { "🤓": 4, "🤔": 3, "❗": 0 },
          daysSinceLastStudy: 3
        }
      },
      subjectTimeData: {
        'Mathematics': 240,
        'Physics': 150,
        'Chemistry': 75,
        'Biology': 210
      },
      inactiveSubjects: [
        { name: 'Chemistry', days: 10 }
      ],
      completedThisWeek: 4,
      totalCompletedNotes: 23,
      currentStreak: streakData.currentStreak || 5,
      subjectProgress: {
        'Mathematics': { percentage: 67, completed: 8, total: 12 },
        'Physics': { percentage: 50, completed: 5, total: 10 },
        'Chemistry': { percentage: 38, completed: 3, total: 8 },
        'Biology': { percentage: 78, completed: 7, total: 9 }
      }
    };
  };
  
  // Stats data
  const statsData = [
    { 
      title: 'Current Streak', 
      value: `${streakData.currentStreak} days`, 
      icon: <FaFire className="text-orange-500" size={20} />, 
      color: 'text-orange-500' 
    },
    { 
      title: 'XP Points', 
      value: streakData.xp, 
      icon: <FaStar className="text-yellow-500" size={20} />, 
      color: 'text-yellow-500' 
    },
    { 
      title: 'Total Notes Completed', 
      value: progressData?.totalCompletedNotes || '0', 
      icon: <FaBook className="text-green-500" size={20} />, 
      color: 'text-green-500' 
    },
    { 
      title: 'Days Active', 
      value: streakData.currentStreak > 0 ? streakData.currentStreak : '0', 
      icon: <FaCalendarAlt className="text-blue-500" size={20} />, 
      color: 'text-blue-500' 
    }
  ];
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">Progress Tracker</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Track your learning journey and academic progress.
        </p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsData.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>
      
      {/* Focus Bar */}
      <FocusBar subjectTimeData={progressData?.subjectTimeData} />
      
      {/* Study Recommendations */}
      <StudyRecommendation subjectsData={progressData?.subjectsData} />
      
      {/* Subject Progress */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Subject Progress</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Only accessible notes with valid links are counted in your progress statistics.
        </p>
        <div className="space-y-6">
          {progressData && Object.entries(progressData.subjectProgress).map(([subject, data]) => (
            <SubjectCard 
              key={subject}
              subject={subject}
              progress={{ completed: data.completed, total: data.total }}
              avgTime={progressData.subjectsData[subject].avgTime}
              emojiStats={progressData.subjectsData[subject].emojiStats}
            />
          ))}
          
          {(!progressData || Object.keys(progressData.subjectProgress || {}).length === 0) && (
            <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-lg shadow">
              <FaBook className="mx-auto text-gray-400 text-4xl mb-3" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No Progress Data Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Start studying and completing notes to see your progress.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Weekly Motivation Cards */}
      <MotivationCards progressData={progressData} />
    </div>
  );
};

export default Progress; 