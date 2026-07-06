import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Bot, Sparkles } from 'lucide-react';
import { aiApi } from '../../api/ai';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}

const STORAGE_KEY = 'eg_coach_convo';
const GREETING: ChatMessage = {
  role: 'bot',
  text: "Hi! I'm your study coach. Ask me what to focus on next. 📚",
};

const SUGGESTIONS = [
  'What should I study today?',
  'Quiz me on something',
  'How do I keep my streak?',
];

/**
 * Floating study-coach chatbot. Sends the recent conversation history so the
 * coach can actually hold a conversation, persists the chat across page
 * navigations (sessionStorage), and shows a "sample mode" hint when the reply
 * came from the deterministic mock rather than a real AI provider.
 */
const StudyTipsBot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      const parsed = saved ? (JSON.parse(saved) as ChatMessage[]) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [GREETING];
    } catch {
      return [GREETING];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sampleMode, setSampleMode] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('token');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, loading]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      /* storage full/blocked — chat still works, just won't persist */
    }
  }, [messages]);

  if (!isAuthed) return null;

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setInput('');
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text: message }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      // Send the last few turns (minus the canned greeting) as context
      const history = nextMessages.slice(-11, -1).filter((m) => m !== GREETING);
      const { reply, provider } = await aiApi.chat(message, history);
      setSampleMode(provider === 'mock');
      setMessages((m) => [...m, { role: 'bot', text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'bot', text: "Sorry, I couldn't respond just now. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        data-testid="study-bot-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open study coach"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-primary text-white shadow-lg
          flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="study-bot-panel"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed bottom-24 right-5 z-40 w-[22rem] max-w-[calc(100vw-2.5rem)] h-[30rem]
              bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700
              flex flex-col overflow-hidden"
          >
            <header className="flex items-center gap-2 px-4 py-3 bg-primary text-white">
              <Bot className="w-5 h-5" />
              <span className="font-semibold">Study Coach</span>
              {sampleMode && (
                <span
                  title="AI is not configured on the server, so replies are canned samples"
                  className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-wide
                    bg-white/20 rounded-full px-2 py-0.5"
                >
                  <Sparkles className="w-3 h-3" /> sample mode
                </span>
              )}
            </header>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-line ${
                    m.role === 'user'
                      ? 'ml-auto bg-primary text-white'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-100'
                  }`}
                >
                  {m.text}
                </motion.div>
              ))}
              {loading && (
                <div className="flex items-center gap-1.5 px-3 py-2 w-fit rounded-lg bg-gray-100 dark:bg-slate-800">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-gray-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1, delay: d * 0.2 }}
                    />
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Quick suggestions (shown while the conversation is fresh) */}
            {messages.length <= 2 && !loading && (
              <div className="px-3 pb-1 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-2.5 py-1 rounded-full border border-primary/40 text-primary
                      hover:bg-primary/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 border-t border-gray-200 dark:border-slate-700 flex items-center gap-2">
              <input
                data-testid="study-bot-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Ask about your studies…"
                className="flex-1 text-sm px-3 py-2 rounded-md border border-gray-200 dark:border-slate-700
                  bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="p-2 rounded-md bg-primary text-white disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StudyTipsBot;
