import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import { aiApi } from '../../api/ai';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}

/**
 * Floating study-coach chatbot available across the app. It sends the student's
 * question to the AI (which receives their progress context server-side) and
 * shows concrete next steps. Only renders for signed-in users.
 */
const StudyTipsBot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: "Hi! I'm your study coach. Ask me what to focus on next. 📚" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('token');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  if (!isAuthed) return null;

  const send = async () => {
    const message = input.trim();
    if (!message || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: message }]);
    setLoading(true);
    try {
      const { reply } = await aiApi.chat(message);
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
            className="fixed bottom-24 right-5 z-40 w-[22rem] max-w-[calc(100vw-2.5rem)] h-[28rem]
              bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700
              flex flex-col overflow-hidden"
          >
            <header className="flex items-center gap-2 px-4 py-3 bg-primary text-white">
              <Bot className="w-5 h-5" />
              <span className="font-semibold">Study Coach</span>
            </header>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-line ${
                    m.role === 'user'
                      ? 'ml-auto bg-primary text-white'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-100'
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> thinking…
                </div>
              )}
              <div ref={endRef} />
            </div>

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
                onClick={send}
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
