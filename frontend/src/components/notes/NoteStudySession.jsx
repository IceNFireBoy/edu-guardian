import React, { useState, useEffect, useRef } from 'react';
import PDFViewer from './PDFViewer';
import FinishStudyingButton from '../progress/FinishStudyingButton';
import { FaClock, FaPause, FaPlay, FaCoffee, FaStopwatch } from 'react-icons/fa';

const formatTime = (timeInSeconds) => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  return [hours, minutes, seconds].map((v) => v.toString().padStart(2, '0')).join(':');
};

const NoteStudySession = ({ noteUrl, noteTitle, noteId, subject }) => {
  // Timers
  const [sessionTime, setSessionTime] = useState(0); // in seconds
  const [breakTime, setBreakTime] = useState(0); // in seconds
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showBreakOptions, setShowBreakOptions] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [studyStartTime] = useState(Date.now());

  const sessionTimerRef = useRef(null);
  const breakTimerRef = useRef(null);

  // Session timer
  useEffect(() => {
    if (!isPaused && !isBreakActive) {
      sessionTimerRef.current = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(sessionTimerRef.current);
  }, [isPaused, isBreakActive]);

  // Break timer
  useEffect(() => {
    if (isBreakActive && breakTime > 0) {
      breakTimerRef.current = setInterval(() => {
        setBreakTime((prev) => {
          if (prev <= 1) {
            setIsBreakActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(breakTimerRef.current);
  }, [isBreakActive, breakTime]);

  // Break controls
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
    if (!minutes || minutes <= 0) return;
    setBreakTime(minutes * 60);
    setIsBreakActive(true);
    setShowBreakOptions(false);
    setCustomTime('');
  };
  const cancelBreak = () => {
    setIsBreakActive(false);
    setBreakTime(0);
  };

  // Pause/resume
  const togglePause = () => setIsPaused((prev) => !prev);

  // Calculate time spent in minutes
  const calculateTimeSpent = () => {
    const now = Date.now();
    return Math.round((now - studyStartTime) / (1000 * 60));
  };

  // UI
  return (
    <div className="relative w-full h-full">
      {/* Overlay: Timers and Controls */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 flex flex-wrap gap-3 items-center bg-white/80 dark:bg-slate-900/80 px-4 py-2 rounded-lg shadow border border-gray-200 dark:border-slate-700">
        {/* Session Timer */}
        <div className="flex items-center gap-2">
          <FaClock className="text-primary" />
          <span className="font-mono text-base">{formatTime(sessionTime)}</span>
          <button onClick={togglePause} className="ml-1 p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded" aria-label={isPaused ? 'Resume timer' : 'Pause timer'}>
            {isPaused ? <FaPlay className="text-green-600" /> : <FaPause className="text-yellow-600" />}
          </button>
        </div>
        {/* Break Timer */}
        {isBreakActive ? (
          <div className="flex items-center gap-2 ml-4">
            <FaCoffee className="text-blue-500" />
            <span className="font-mono text-base">{formatTime(breakTime)}</span>
            <button onClick={cancelBreak} className="ml-1 p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded text-xs">End Break</button>
          </div>
        ) : (
          <div className="flex items-center gap-2 ml-4">
            <button onClick={() => setShowBreakOptions((v) => !v)} className="p-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center gap-1">
              <FaStopwatch /> Break
            </button>
            {showBreakOptions && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-3 z-50 flex flex-col gap-2 min-w-[200px]">
                <button onClick={startShortBreak} className="w-full text-left px-3 py-2 hover:bg-blue-100 dark:hover:bg-slate-700 rounded">Short Break (10 min)</button>
                <button onClick={startLongBreak} className="w-full text-left px-3 py-2 hover:bg-blue-100 dark:hover:bg-slate-700 rounded">Long Break (30 min)</button>
                <div className="flex items-center gap-2 mt-2">
                  <input type="number" min="1" value={customTime} onChange={e => setCustomTime(e.target.value)} placeholder="Custom (min)" className="w-20 px-2 py-1 rounded border dark:bg-slate-700 dark:text-white" />
                  <button onClick={startCustomBreak} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm" disabled={!customTime || isNaN(customTime) || parseInt(customTime) <= 0}>Set</button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Finish Studying Button */}
        <div className="ml-4">
          <FinishStudyingButton
            noteId={noteId}
            onFinish={() => {}}
            initialStartTime={studyStartTime}
            subject={subject}
          />
        </div>
      </div>
      {/* PDF Viewer (do not touch) */}
      <PDFViewer noteUrl={noteUrl} noteTitle={noteTitle} noteId={noteId} />
    </div>
  );
};

export default NoteStudySession; 