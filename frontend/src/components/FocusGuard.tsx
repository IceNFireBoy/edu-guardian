import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeOff, ShieldAlert } from 'lucide-react';
import { getDevFlags, DEV_FLAGS_EVENT, DevFlags } from '../utils/devFlags';

/**
 * Anti-cheat demo: while enabled (Settings → Developer/Demo), the moment the
 * tab is hidden or the window loses focus, the whole app is covered by a
 * blurred overlay and the switch is counted. Coming back shows a brief
 * "focus check" banner with the tally.
 *
 * Honest limitation: a web page cannot see OTHER tabs (e.g. it can't detect a
 * Google Form being open elsewhere) — leaving-the-tab detection is the
 * browser-sandbox equivalent, and is what proctoring demos actually show.
 */
const FocusGuard: React.FC = () => {
  const [enabled, setEnabled] = useState(() => getDevFlags().focusGuard);
  const [away, setAway] = useState(false);
  const [switches, setSwitches] = useState(0);
  const [showReturnBanner, setShowReturnBanner] = useState(false);

  // React instantly to the Settings toggle
  useEffect(() => {
    const onFlags = (e: Event) => {
      const flags = (e as CustomEvent<DevFlags>).detail ?? getDevFlags();
      setEnabled(flags.focusGuard);
      if (!flags.focusGuard) {
        setAway(false);
        setSwitches(0);
      }
    };
    window.addEventListener(DEV_FLAGS_EVENT, onFlags);
    return () => window.removeEventListener(DEV_FLAGS_EVENT, onFlags);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const goAway = () => {
      setAway((was) => {
        if (!was) setSwitches((n) => n + 1);
        return true;
      });
    };
    const comeBack = () => {
      setAway((was) => {
        if (was) {
          setShowReturnBanner(true);
          setTimeout(() => setShowReturnBanner(false), 3500);
        }
        return false;
      });
    };

    const onVisibility = () => (document.hidden ? goAway() : comeBack());
    window.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', goAway);
    window.addEventListener('focus', comeBack);
    return () => {
      window.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', goAway);
      window.removeEventListener('focus', comeBack);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Full-screen blur while the student is away from this tab/window */}
      <AnimatePresence>
        {away && (
          <motion.div
            data-testid="focus-guard-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] backdrop-blur-xl bg-white/60 dark:bg-slate-900/70
              flex flex-col items-center justify-center text-center p-6"
          >
            <EyeOff className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Focus check</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm">
              This activity is monitored. Content stays hidden while you're away from this tab —
              come back to continue.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return banner with the tab-switch tally */}
      <AnimatePresence>
        {showReturnBanner && !away && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2
              px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/70 border border-yellow-300
              dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 text-sm shadow-lg"
          >
            <ShieldAlert className="w-4 h-4" />
            Tab switch recorded — {switches} total this session
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FocusGuard;
