# Unused or Deprecated Code

This document tracks code that is either unused or deprecated in the EduGuardian project. This helps maintain code quality and prevents confusion about which parts of the codebase are still in use.

## Hooks

### useStreak.ts

**Status:** Deprecated

**Location:** `frontend/src/hooks/useStreak.ts`

**Reason for Deprecation:**
- The hook was originally designed to manage streak and XP data using localStorage
- Now that we have a backend with proper user profile management, this functionality is handled by the `useUser` hook
- The hook's functionality is now redundant as streak, XP, and level data are managed through the backend

**Current Usage:**
- The hook is still being used in some components but should be phased out
- All streak and XP-related functionality should use `useUser().profile` instead

**Migration Path:**
1. Replace all instances of `useStreak()` with `useUser()`
2. Access streak data through `profile.streak`
3. Access XP and level through `profile.xp` and `profile.level`
4. For activity tracking, use the backend's activity logging system

**Example Migration:**
```typescript
// Old way (deprecated)
const { streak, recordActivity } = useStreak();

// New way
const { profile } = useUser();
const streak = profile.streak;
const xp = profile.xp;
const level = profile.level;
```

**Components to Update:**
- [ ] Progress.tsx
- [ ] DashboardFeed.tsx
- [ ] Any other components using useStreak

**Note:** This hook should be removed once all components have been migrated to use the backend data through `useUser`.

---

*This document will be updated as more code is identified as unused or deprecated.* 