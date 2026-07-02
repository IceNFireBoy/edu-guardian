import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Send, Play, Pause, RotateCcw, LogOut, Timer } from 'lucide-react';
import { API_BASE_URL } from '../api/apiClient';

interface ChatEntry {
  kind: 'message' | 'system';
  user?: string;
  text: string;
  ts: number;
  mine?: boolean;
}

type Mode = 'focus' | 'break';
interface PomodoroState {
  mode: Mode;
  running: boolean;
  endsAt: number | null;
  remaining: number; // seconds
}

const DURATIONS: Record<Mode, number> = { focus: 25 * 60, break: 5 * 60 };
const socketOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

const currentUserName = (): string => {
  try {
    const raw = localStorage.getItem('user');
    if (raw) return JSON.parse(raw)?.name || JSON.parse(raw)?.username || 'A student';
  } catch {
    /* ignore */
  }
  return 'A student';
};

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/**
 * Real-time study rooms: enter a shared room code to chat with classmates and
 * run a Pomodoro timer that stays in sync for everyone. Degrades gracefully —
 * if the socket can't connect, the page simply shows a disconnected state.
 */
const StudyRooms: React.FC = () => {
  const [roomInput, setRoomInput] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [members, setMembers] = useState(1);
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [message, setMessage] = useState('');
  const [timer, setTimer] = useState<PomodoroState>({
    mode: 'focus',
    running: false,
    endsAt: null,
    remaining: DURATIONS.focus,
  });

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const name = useMemo(currentUserName, []);

  // Local 1s tick to advance a running timer from its authoritative endsAt.
  useEffect(() => {
    if (!timer.running || !timer.endsAt) return;
    const id = setInterval(() => {
      setTimer((t) => {
        if (!t.running || !t.endsAt) return t;
        const remaining = Math.max(0, Math.round((t.endsAt - Date.now()) / 1000));
        return remaining === 0 ? { ...t, running: false, remaining: 0, endsAt: null } : { ...t, remaining };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timer.running, timer.endsAt]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const join = () => {
    const id = roomInput.trim();
    if (!id) return;

    const socket = io(socketOrigin, {
      auth: { token: localStorage.getItem('token'), name },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('room:join', { roomId: id });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on('room:presence', (p: { members: number }) => setMembers(p.members));
    socket.on('room:system', (m: { text: string; ts: number }) =>
      setChat((c) => [...c, { kind: 'system', text: m.text, ts: m.ts }])
    );
    socket.on('room:message', (m: { user: string; text: string; ts: number }) =>
      setChat((c) => [...c, { kind: 'message', user: m.user, text: m.text, ts: m.ts, mine: m.user === name }])
    );
    socket.on('pomodoro:state', (p: { state: PomodoroState }) => {
      if (p?.state) setTimer(p.state);
    });

    setRoomId(id);
  };

  const leave = () => {
    if (roomId) socketRef.current?.emit('room:leave', { roomId });
    socketRef.current?.disconnect();
    socketRef.current = null;
    setRoomId(null);
    setConnected(false);
    setChat([]);
    setMembers(1);
  };

  const send = () => {
    const text = message.trim();
    if (!text || !roomId) return;
    socketRef.current?.emit('room:message', { roomId, text });
    setMessage('');
  };

  const broadcastTimer = (state: PomodoroState) => {
    if (roomId) socketRef.current?.emit('pomodoro:update', { roomId, state });
  };

  const startPause = () => {
    setTimer((t) => {
      const next: PomodoroState = t.running
        ? { ...t, running: false, remaining: t.remaining, endsAt: null }
        : { ...t, running: true, endsAt: Date.now() + t.remaining * 1000 };
      broadcastTimer(next);
      return next;
    });
  };

  const reset = (mode: Mode) => {
    const next: PomodoroState = { mode, running: false, endsAt: null, remaining: DURATIONS[mode] };
    setTimer(next);
    broadcastTimer(next);
  };

  if (!roomId) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <Users className="w-12 h-12 mx-auto text-primary mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Study Rooms</h1>
        <p className="text-gray-500 mb-6">
          Enter a room code to study together — share a live chat and a synced Pomodoro timer.
        </p>
        <div className="flex gap-2">
          <input
            data-testid="room-code-input"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && join()}
            placeholder="e.g. bio-101"
            className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-slate-700
              bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            data-testid="room-join-btn"
            onClick={join}
            disabled={!roomInput.trim()}
            className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            Join
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4">
      {/* Chat column */}
      <div className="md:col-span-2 flex flex-col h-[70vh] rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Room: {roomId}</h2>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
              <Users className="w-3 h-3" /> {members} online
            </p>
          </div>
          <button onClick={leave} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
            <LogOut className="w-4 h-4" /> Leave
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chat.map((c, i) =>
            c.kind === 'system' ? (
              <p key={i} className="text-center text-xs text-gray-400">{c.text}</p>
            ) : (
              <div
                key={i}
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  c.mine
                    ? 'ml-auto bg-primary text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-100'
                }`}
              >
                {!c.mine && <span className="block text-[10px] opacity-70">{c.user}</span>}
                {c.text}
              </div>
            )
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-slate-700 flex gap-2">
          <input
            data-testid="room-message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Message the room…"
            className="flex-1 px-3 py-2 rounded-md border border-gray-200 dark:border-slate-700
              bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button onClick={send} disabled={!message.trim()} className="p-2 rounded-md bg-primary text-white disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Shared Pomodoro column */}
      <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center">
        <h3 className="flex items-center justify-center gap-2 font-semibold text-gray-900 dark:text-white mb-3">
          <Timer className="w-4 h-4 text-primary" /> Shared Pomodoro
        </h3>
        <AnimatePresence mode="wait">
          <motion.div
            key={timer.remaining}
            initial={{ opacity: 0.6, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-5xl font-mono font-bold mb-1 ${
              timer.mode === 'focus' ? 'text-primary' : 'text-green-500'
            }`}
          >
            {fmt(timer.remaining)}
          </motion.div>
        </AnimatePresence>
        <p className="text-xs uppercase tracking-wide text-gray-400 mb-4">{timer.mode}</p>

        <div className="flex justify-center gap-2 mb-3">
          <button onClick={startPause} className="px-4 py-2 rounded-md bg-primary text-white flex items-center gap-1">
            {timer.running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {timer.running ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={() => reset(timer.mode)}
            className="px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-center gap-2 text-sm">
          <button
            onClick={() => reset('focus')}
            className={`px-3 py-1 rounded-md ${timer.mode === 'focus' ? 'bg-primary/10 text-primary' : 'text-gray-500'}`}
          >
            Focus 25
          </button>
          <button
            onClick={() => reset('break')}
            className={`px-3 py-1 rounded-md ${timer.mode === 'break' ? 'bg-green-500/10 text-green-600' : 'text-gray-500'}`}
          >
            Break 5
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyRooms;
