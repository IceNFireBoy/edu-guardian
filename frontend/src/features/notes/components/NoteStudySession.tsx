import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FaClock, FaPause, FaPlay, FaCoffee, FaStopwatch, FaTimes, FaDownload,
  FaStar, FaCheckCircle, FaFire, FaTrophy, FaHourglassHalf
} from 'react-icons/fa';
import { Note } from '../../types/note';
import { useUser, StudyCompletionResult } from '../../user/useUser';
import { useNote } from '../useNote';

const formatTime = (timeInSeconds: number): string => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  return [hours, minutes, seconds].map((v) => v.toString().padStart(2, '0')).join(':');
};

const POMODORO_FOCUS_SECONDS = 25 * 60;
const POMODORO_BREAK_SECONDS = 5 * 60;

interface NoteStudySessionProps {
  note: Note | null;
  open: boolean;
  onClose: () => void;
}

const NoteStudySession: React.FC<NoteStudySessionProps> = ({ note, open, onClose }) => {
  if (!note) {
    return null;
  }

  const navigate = useNavigate();
  const { completeStudy } = useUser();
  const { rateNote, incrementDownloadCount } = useNote();

  const [sessionTime, setSessionTime] = useState<number>(0);
  const [breakTime, setBreakTime] = useState<number>(0);
  const [isBreakActive, setIsBreakActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showBreakOptions, setShowBreakOptions] = useState<boolean>(false);
  const [customTime, setCustomTime] = useState<string>('');
  const [pomodoroMode, setPomodoroMode] = useState<boolean>(false);
  const [finishing, setFinishing] = useState<boolean>(false);
  const [completion, setCompletion] = useState<StudyCompletionResult | null>(null);
  const [completedSeconds, setCompletedSeconds] = useState<number>(0);
  const [userRating, setUserRating] = useState<number>(0);

  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const breakTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPaused && !isBreakActive && !completion) {
      sessionTimerRef.current = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [isPaused, isBreakActive, completion]);

  // Pomodoro: after each 25 minutes of focus, automatically start a 5 minute
  // break so the cycle takes care of itself.
  useEffect(() => {
    if (pomodoroMode && sessionTime > 0 && sessionTime % POMODORO_FOCUS_SECONDS === 0 && !isBreakActive) {
      setBreakTime(POMODORO_BREAK_SECONDS);
      setIsBreakActive(true);
      toast('25 minutes of focus done — enjoy a 5 minute break! ☕', { icon: '🍅' });
    }
  }, [sessionTime, pomodoroMode, isBreakActive]);

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

  const startBreak = (minutes: number) => {
    setBreakTime(minutes * 60);
    setIsBreakActive(true);
    setShowBreakOptions(false);
  };
  const startCustomBreak = () => {
    const minutes = parseInt(customTime);
    if (isNaN(minutes) || minutes <= 0) return;
    startBreak(minutes);
    setCustomTime('');
  };

  const togglePause = () => setIsPaused((prev) => !prev);

  const handleFinishStudying = async () => {
    if (sessionTime < 5) {
      toast('Study a little longer before finishing — the timer has barely started!', { icon: '⏳' });
      return;
    }
    setFinishing(true);
    const result = await completeStudy({ noteId: note._id, duration: sessionTime });
    setFinishing(false);
    if (result) {
      setCompletedSeconds(sessionTime);
      setCompletion(result);
    } else {
      toast.error('Could not save this session. If you just finished one, wait a few minutes and try again.');
    }
  };

  const handleKeepStudying = () => {
    setCompletion(null);
    setSessionTime(0);
  };

  const handleDownload = async () => {
    if (!note.fileUrl) {
      toast.error('This note has no downloadable file.');
      return;
    }
    incrementDownloadCount(note._id); // fire-and-forget count update
    window.open(note.fileUrl, '_blank', 'noopener');
  };

  const handleRate = async (value: number) => {
    setUserRating(value);
    const result = await rateNote(note._id, value);
    if (result) {
      toast.success(`Rated ${value} star${value === 1 ? '' : 's'} — thanks!`);
    } else {
      setUserRating(0);
    }
  };

  return (
    <>
      {/* Mobile backdrop for the slide-over drawer */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* One instance, two presentations: slide-over drawer below lg,
          in-flow side column on lg+ (so it can never overlap the PDF). */}
      <aside
        className={`bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 flex flex-col
          fixed inset-y-0 right-0 z-50 w-80 shadow-2xl transform transition-transform duration-300
          ${open ? 'translate-x-0' : 'translate-x-full'}
          lg:static lg:z-auto lg:shadow-none lg:transform-none lg:transition-none lg:w-80 xl:w-96 lg:shrink-0
          ${open ? 'lg:flex' : 'lg:hidden'}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 shrink-0">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Study Session</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400"
            aria-label="Close study panel"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-4 overflow-y-auto">
          <section>
            <h3 className="text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-2">SESSION TIMER</h3>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <FaClock className="text-primary dark:text-primary-light" />
              <span className="font-mono text-xl text-gray-800 dark:text-gray-100">{formatTime(sessionTime)}</span>
              <button
                onClick={togglePause}
                className="ml-auto p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full"
                aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
              >
                {isPaused ? <FaPlay className="text-green-500" /> : <FaPause className="text-yellow-500" />}
              </button>
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={pomodoroMode}
                onChange={(e) => setPomodoroMode(e.target.checked)}
                className="rounded border-gray-300 dark:border-slate-600"
              />
              <span>🍅 Pomodoro mode (25 min focus / 5 min break)</span>
            </label>
          </section>

          <section>
            <h3 className="text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-2">BREAK TIMER</h3>
            {isBreakActive ? (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <FaCoffee className="text-blue-500" />
                <span className="font-mono text-xl text-blue-700 dark:text-blue-300">{formatTime(breakTime)}</span>
                <button
                  onClick={cancelBreak}
                  className="ml-auto px-2 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-200 rounded-full text-xs font-medium"
                >
                  End
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowBreakOptions((v) => !v)}
                  className="btn btn-outline btn-sm w-full flex items-center justify-center gap-1"
                >
                  <FaStopwatch /> Take a Break
                </button>
                {showBreakOptions && (
                  <div className="absolute mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl p-3 z-10 flex flex-col gap-2">
                    <button onClick={() => startBreak(5)} className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 rounded">Quick Break (5 min)</button>
                    <button onClick={() => startBreak(10)} className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 rounded">Short Break (10 min)</button>
                    <button onClick={() => startBreak(30)} className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 rounded">Long Break (30 min)</button>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                      <input
                        type="number"
                        min="1"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        placeholder="Mins"
                        className="w-1/2 input input-sm dark:bg-slate-700 dark:text-gray-100"
                      />
                      <button
                        onClick={startCustomBreak}
                        className="btn btn-primary btn-sm flex-grow"
                        disabled={!customTime || isNaN(parseInt(customTime)) || parseInt(customTime) <= 0}
                      >
                        Set
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-2">RATE THIS NOTE</h3>
            <div className="flex items-center gap-1 p-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  className="p-1 transition-transform hover:scale-125"
                  aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                >
                  <FaStar className={`text-xl ${star <= userRating ? 'text-yellow-400' : 'text-gray-300 dark:text-slate-600'}`} />
                </button>
              ))}
            </div>
          </section>

          <section className="mt-auto">
            <h3 className="text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-2">ACTIONS</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDownload}
                className="btn btn-outline w-full flex items-center justify-center gap-2"
              >
                <FaDownload /> Download PDF
              </button>
              <button
                onClick={handleFinishStudying}
                disabled={finishing}
                className="btn btn-success w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {finishing ? <FaHourglassHalf className="animate-pulse" /> : <FaCheckCircle />}
                {finishing ? 'Saving session…' : 'Finish Studying'}
              </button>
            </div>
          </section>
        </div>
      </aside>

      {/* Completion summary modal */}
      {completion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-4">
              <FaCheckCircle className="text-3xl text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Session complete!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-5">
              You studied <span className="font-semibold">"{note.title}"</span> for {formatTime(completedSeconds)}.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">+{completion.xpEarned}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">XP earned</div>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/30">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1">
                  <FaFire /> {completion.streak?.current ?? 1}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">day streak</div>
              </div>
            </div>
            {completion.newBadges.length > 0 && (
              <div className="mb-6 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center gap-2 text-violet-700 dark:text-violet-300">
                <FaTrophy /> New badge{completion.newBadges.length > 1 ? 's' : ''} earned!
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleKeepStudying} className="btn btn-outline flex-1">Keep Studying</button>
              <button onClick={() => navigate('/notes')} className="btn btn-primary flex-1">Back to Notes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NoteStudySession;
