// Diagnostic kill-switches while we chase the production outage: the UI for
// these features is hidden when false so the app runs in a minimal
// notes-plus-login mode. Flip back to true to restore everything - no other
// code changes needed. Backend endpoints stay live either way.
export const FEATURES = {
  /** AI summaries, AI flashcard generation, quota/usage panels, study mode */
  ai: false,
  /** Badges, XP/levels, streaks, progress page, achievements */
  gamification: false,
} as const;
