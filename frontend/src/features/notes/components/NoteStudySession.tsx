import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaClock, FaPause, FaPlay, FaCoffee, FaStopwatch } from 'react-icons/fa';
import { Note, NoteStudySession as NoteStudySessionType } from '../noteTypes'; // Assuming NoteStudySessionType is in noteTypes
import AIFeaturesPanel from './AIFeaturesPanel'; // Corrected import path
// import FinishStudyingButton from '../../progress/FinishStudyingButton'; // Assuming this will be converted/available
// For now, let's create a placeholder for FinishStudyingButton if it's not critical for this step

interface FinishStudyingButtonProps {
  noteId: string | undefined;
  onFinish: (studyData: any) => void; // Define a proper type for studyData later
  initialStartTime: number;
  subject: string | undefined;
}
const FinishStudyingButtonPlaceholder: React.FC<FinishStudyingButtonProps> = ({ onFinish }) => (
  <button onClick={() => onFinish({ timeSpent: 10, focusScore: 0.8 })} className="btn btn-success w-full">
    Finish Studying (Placeholder)
  </button>
);

const formatTime = (timeInSeconds: number): string => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  return [hours, minutes, seconds].map((v) => v.toString().padStart(2, '0')).join(':');
};

// Placeholder for getAIPref if not immediately refactoring localStorage access
// const getAIPref = (): string => {
//   return localStorage.getItem('aiFeaturesLocation') || 'both'; 
// };

interface NoteStudySessionProps {
  note: Note | null; // Can be null if note data isn't loaded yet
  // noteUrl?: string; // From original, seems unused if PDFViewer is not here
  // noteTitle?: string; // Available from note object
  // noteId?: string; // Available from note object
  // subject?: string; // Available from note object
  sidebarMode?: boolean; // To render only controls
  onBreakStateChange?: (breakState: { isBreakActive: boolean; breakTime: number; cancelBreak: () => void }) => void;
  // onSessionEnd?: (sessionData: NoteStudySessionType) => void; // For saving session data
}

const NoteStudySession: React.FC<NoteStudySessionProps> = ({ 
  note,
  sidebarMode = true, // Defaulting to sidebarMode as per original dominant use case
  onBreakStateChange,
  // onSessionEnd 
}) => {
  const [sessionTime, setSessionTime] = useState<number>(0); 
  const [breakTime, setBreakTime] = useState<number>(0); 
  const [isBreakActive, setIsBreakActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showBreakOptions, setShowBreakOptions] = useState<boolean>(false);
  const [customTime, setCustomTime] = useState<string>('');
  const [studyStartTime] = useState<number>(Date.now());
  // const [aiPref, setAiPref] = useState<string>(getAIPref()); // Placeholder if needed

  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const breakTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPaused && !isBreakActive) {
      sessionTimerRef.current = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [isPaused, isBreakActive]);

  useEffect(() => {
    if (isBreakActive && breakTime > 0) {
      breakTimerRef.current = setInterval(() => {
        setBreakTime((prev) => {
          if (prev <= 1) {
            setIsBreakActive(false);
            // Potentially auto-resume session timer or notify user
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (breakTimerRef.current) {
        clearInterval(breakTimerRef.current);
    }
    return () => {
      if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    };
  }, [isBreakActive, breakTime]);

  const cancelBreak = useCallback(() => {
    setIsBreakActive(false);
    setBreakTime(0);
  }, []);

  useEffect(() => {
    if (typeof onBreakStateChange === 'function') {
      onBreakStateChange({
        isBreakActive,
        breakTime,
        cancelBreak,
      });
    }
  }, [isBreakActive, breakTime, onBreakStateChange, cancelBreak]);

  const startShortBreak = () => {
    setBreakTime(10 * 60);
    setIsBreakActive(true);
    setShowBreakOptions(false);
  };
  const startLongBreak = () => {
    setBreakTime(30 * 60);
    setIsBreakActive(true);
    setShowBreakOptions(false);
  };
  const startCustomBreak = () => {
    const minutes = parseInt(customTime);
    if (isNaN(minutes) || minutes <= 0) return;
    setBreakTime(minutes * 60);
    setIsBreakActive(true);
    setShowBreakOptions(false);
    setCustomTime('');
  };

  const togglePause = () => setIsPaused((prev) => !prev);

  // const calculateTimeSpentMinutes = (): number => {
  //   const now = Date.now();
  //   return Math.round((now - studyStartTime) / (1000 * 60));
  // };

  // Placeholder for actually finishing and saving the session
  const handleFinishStudying = (studyData: any) => {
    console.log('Study session finished:', studyData);
    console.log('Total session time (seconds): ', sessionTime);
    // if (onSessionEnd && note) {
    //   const sessionDataToSave: Partial<NoteStudySessionType> = {
    //     noteId: note.id,
    //     userId: 'current_user_id', // Replace with actual user ID from auth context
    //     startTime: new Date(studyStartTime),
    //     endTime: new Date(),
    //     // ... other data like focusScore, flashcardsReviewed if tracked
    //   };
    //   onSessionEnd(sessionDataToSave as NoteStudySessionType);
    // }
  };

  if (!sidebarMode) {
    // Original component had a PDFViewer here if not in sidebarMode.
    // For this refactor, assuming sidebarMode is the primary use or PDF viewing is handled by parent.
    console.warn('NoteStudySession is primarily designed for sidebarMode in this refactor.');
    return null; 
  }

  return (
    <aside className="flex flex-col gap-4 overflow-y-auto max-h-screen p-4 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 min-w-[280px] max-w-[350px] shadow-lg sticky top-0 z-40">
      <section>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">SESSION TIMER</h3>
        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-800 rounded-md">
          <FaClock className="text-primary dark:text-primary-light" />
          <span className="font-mono text-lg text-gray-700 dark:text-gray-200">{formatTime(sessionTime)}</span>
          <button onClick={togglePause} className="ml-auto p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full" aria-label={isPaused ? 'Resume timer' : 'Pause timer'}>
            {isPaused ? <FaPlay className="text-green-500" /> : <FaPause className="text-yellow-500" />}
          </button>
        </div>
      </section>
      
      <section>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">BREAK TIMER</h3>
        {isBreakActive ? (
          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md">
            <FaCoffee className="text-blue-500" />
            <span className="font-mono text-lg text-blue-700 dark:text-blue-300">{formatTime(breakTime)}</span>
            <button onClick={cancelBreak} className="ml-auto p-1 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-200 rounded-full text-xs">End</button>
          </div>
        ) : (
          <div className="relative">
            <button onClick={() => setShowBreakOptions((v) => !v)} className="btn btn-outline btn-sm w-full flex items-center justify-center gap-1">
              <FaStopwatch /> Take a Break
            </button>
            {showBreakOptions && (
              <div className="absolute mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl p-3 z-50 flex flex-col gap-2">
                <button onClick={startShortBreak} className="w-full text-left px-3 py-2 hover:bg-blue-100 dark:hover:bg-slate-700 rounded">Short Break (10 min)</button>
                <button onClick={startLongBreak} className="w-full text-left px-3 py-2 hover:bg-blue-100 dark:hover:bg-slate-700 rounded">Long Break (30 min)</button>
                <div className="flex items-center gap-2 pt-1 border-t border-gray-200 dark:border-slate-700 mt-1">
                  <input type="number" min="1" value={customTime} onChange={e => setCustomTime(e.target.value)} placeholder="Mins" className="w-1/2 input input-sm dark:bg-slate-700" />
                  <button onClick={startCustomBreak} className="btn btn-primary btn-sm flex-grow" disabled={!customTime || isNaN(parseInt(customTime)) || parseInt(customTime) <= 0}>Set Custom</button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      
      <section>
         <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">ACTIONS</h3>
        <FinishStudyingButtonPlaceholder
          noteId={note?.id}
          onFinish={handleFinishStudying} // Replace with actual onFinish from props if session data is saved
          initialStartTime={studyStartTime}
          subject={note?.subject}
        />
      </section>
      
      {note && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 mt-2">AI TOOLS</h3>
          <AIFeaturesPanel note={note} />
        </section>
      )}
    </aside>
  );
};

export default NoteStudySession; 