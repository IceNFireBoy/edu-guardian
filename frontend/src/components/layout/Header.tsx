import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMoon, FaSun, FaBell, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { useStreak } from '../../hooks/useStreak';
import { useAuthContext } from '../../features/auth/AuthContext';
import { useUser } from '../../features/user/useUser';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import { getRelativeTime } from '../../utils/dateUtils';

interface HeaderProps {
  toggleDarkMode: () => void;
}

const SEEN_KEY = 'eg_notif_seen_at';

// Human-friendly titles for activity feed entries
const activityTitle = (action: string, description: string, xp: number): string => {
  const icons: Record<string, string> = {
    login: '👋',
    study: '📖',
    upload: '📤',
    download: '📥',
    rate: '⭐',
    share: '🔗',
    earn_badge: '🏅',
    earn_xp: '✨',
  };
  const icon = icons[action] ?? '🔔';
  const xpNote = xp > 0 ? ` (+${xp} XP)` : '';
  return `${icon} ${description || action}${xpNote}`;
};

const Header: React.FC<HeaderProps> = ({ toggleDarkMode }) => {
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [seenAt, setSeenAt] = useState<number>(() => Number(localStorage.getItem(SEEN_KEY)) || 0);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { streak: streakData } = useStreak();
  const { isAuthenticated } = useAuthContext();
  const { profile } = useUser();

  const currentStreak = streakData?.currentStreak || 0;
  const xp = streakData?.xp || 0;

  // Motivational quotes
  const quotes = [
    "Education is the passport to the future.",
    "The beautiful thing about learning is nobody can take it away from you.",
    "The more that you read, the more things you will know.",
    "Education is not preparation for life; education is life itself."
  ];

  const randomQuote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);

  // Real notifications: the user's recent activity from the profile
  const notifications = useMemo(() => {
    return (profile?.activity ?? []).slice(0, 8).map((a) => ({
      id: a._id ?? `${a.action}-${a.timestamp}`,
      title: activityTitle(a.action, a.description, a.xpEarned ?? 0),
      time: getRelativeTime(a.timestamp),
      unread: new Date(a.timestamp).getTime() > seenAt,
    }));
  }, [profile?.activity, seenAt]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const markAllAsRead = () => {
    const now = Date.now();
    setSeenAt(now);
    try {
      localStorage.setItem(SEEN_KEY, String(now));
    } catch {
      /* storage blocked — unread state just won't persist */
    }
    setShowNotifications(false);
  };

  return (
    <header className="bg-white/95 dark:bg-slate-800/95 backdrop-blur border-b border-gray-200 dark:border-slate-700 shrink-0 z-30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {isAuthenticated ? (
              <>
                <motion.div
                  className="bg-accent/10 px-3 py-1 rounded-full flex items-center mr-3"
                  whileHover={{ scale: 1.05 }}
                  aria-label={`Current streak: ${currentStreak} days`}
                >
                  <span className="font-medium text-accent-dark dark:text-accent-light">🔥 {currentStreak} day{currentStreak === 1 ? '' : 's'}</span>
                </motion.div>

                <motion.div
                  className="bg-primary/10 px-3 py-1 rounded-full flex items-center"
                  whileHover={{ scale: 1.05 }}
                  aria-label={`Experience points: ${xp}`}
                >
                  <span className="font-medium text-primary dark:text-primary-light">⭐ {xp} XP</span>
                </motion.div>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-full flex items-center"
                >
                  <FaSignInAlt className="mr-1 text-primary dark:text-primary-light" />
                  <span className="font-medium text-primary dark:text-primary-light">Login</span>
                </Link>
                <Link
                  to="/register"
                  className="bg-secondary/10 hover:bg-secondary/20 px-3 py-1 rounded-full flex items-center"
                >
                  <FaUserPlus className="mr-1 text-secondary dark:text-secondary-light" />
                  <span className="font-medium text-secondary dark:text-secondary-light">Register</span>
                </Link>
              </div>
            )}
          </div>

          <div className="text-gray-500 dark:text-gray-400 italic text-sm max-w-md hidden md:block truncate">
            "{randomQuote}"
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <div className="relative" ref={notificationRef}>
                <button
                  className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                  aria-haspopup="true"
                >
                  <FaBell size={20} />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </button>

                {/* Notification dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-slate-700"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="notification-menu"
                    >
                      <div className="p-3 border-b border-gray-200 dark:border-slate-700">
                        <h3 className="font-medium text-gray-800 dark:text-gray-100">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map(notification => (
                            <div
                              key={notification.id}
                              className={`p-3 border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 ${
                                notification.unread ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <p className="text-gray-800 dark:text-gray-100 text-sm">{notification.title}</p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{notification.time}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                            No notifications yet — activity like uploads, badges and study
                            sessions shows up here.
                          </div>
                        )}
                      </div>
                      <div className="p-3 text-center">
                        <button
                          className="text-primary dark:text-primary-light text-sm hover:underline"
                          onClick={markAllAsRead}
                          aria-label="Mark all notifications as read"
                        >
                          Mark all as read
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button
              onClick={toggleDarkMode}
              className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light"
              aria-label="Toggle dark mode"
              role="switch"
              aria-checked={document.documentElement.classList.contains('dark')}
            >
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <FaMoon size={20} className="dark:hidden" />
                <FaSun size={20} className="hidden dark:block" />
              </motion.div>
            </button>

            {isAuthenticated && profile && (
              <Link
                to="/profile"
                className="flex items-center gap-2 group"
                aria-label="Your profile"
              >
                <Avatar src={profile.profileImage} alt={profile.name || profile.username} size="sm" />
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary">
                  {profile.name?.split(' ')[0] || profile.username}
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
