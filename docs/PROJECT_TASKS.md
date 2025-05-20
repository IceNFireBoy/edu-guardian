# EduGuardian Project Tasks

This document tracks all current, upcoming, and long-term TODOs for the EduGuardian project.
It is intended to be dynamically updated.

## In Progress
- [ ] Frontend TypeScript migration for remaining features
- [ ] Frontend component refactoring
- [ ] API integration with backend
- [x] **Resolve Test Failures and SonarQube Issues**
  - [x] Standardize backend test mocking (Jest vs. Vitest) in `AuthService.test.ts`, `user.test.ts`, `BadgeService.test.ts`, `note.factory.ts`.
  - [x] Correct factory usage (`mockUser`, `mockUserActivity`, etc.) in backend tests.
  - [x] Correct `IUserActivity` factory to use `timestamp` instead of `createdAt`.
  - [x] Correct `User` model default import in `User.test.ts`.
  - [x] Correct `ErrorResponse` default import in `errorHandler.test.ts`.
  - [x] Add null check for `note` in `Note.test.ts`.
  - [x] Refine `note.factory.ts` for `user` field and `id`/`_id` consistency.
  - [x] Clean up unused imports in component tests.
  - [x] Fix PDF rendering tests in `PDFViewer.test.tsx`.
  - [x] Add appropriate mock data for document and context objects in tests.
  - [x] Fix React hooks usage in test environment.
  - [x] Created missing asyncHandler middleware.
  - [x] Fixed JSX in TypeScript files (useAntiCheating.tsx).
  - [x] Fixed syntax errors in NoteViewer.tsx.
  - [x] Created render.yaml for Render deployment.
  - [x] Added deployment documentation.
- [x] **Ensure Deployment Readiness**
  - [x] Fixed NoteController export issue
  - [x] Created missing hooks (useAuth, usePDFNote)
  - [x] Added project-level npm scripts for building and running
  - [x] Fixed frontend build issues
  - [x] Updated deployment documentation with troubleshooting tips
  - [x] Fixed controller class exports and instantiations in route files
  - [x] Fixed import paths for asyncHandler middleware
  - [x] Downgraded problematic frontend dependencies in package.json
  - [x] Added custom netlify.toml with environment variables
  - [x] Resolved all backend TypeScript errors
- [ ] Frontend UI refinement

## Upcoming
- [ ] Testing and documentation (after current test failures resolved)
- [ ] Performance optimization
- [ ] Security enhancements

---

# Detailed TODOs & Placeholders

This section lists specific items requiring attention, often from code comments or longer-term refactoring goals.

## Backend Service TODOs (Placeholder Implementations)

This file lists methods in the backend services that currently have placeholder implementations or require further development.

### `UserService.ts`

- `public async getUsers(): Promise<IUser[]>`
  - TODO: Implement pagination and filtering if necessary for admin views.
- `public async getUserActivityLog(userId: string, queryOptions: UserActivityQueryOptions): Promise<IUserActivity[]>`
  - TODO: Implement actual fetching of user activity log with pagination and filtering. Needs to define return type for pagination.
- `public async getUserUploadedNotes(userId: string, queryOptions: UserNotesQueryOptions): Promise<any>`
  - TODO: Implement fetching user\'s uploaded notes with pagination and filtering. Query Note model. Define proper return type for pagination.
- `public async getUserFavoriteNotes(userId: string, queryOptions: UserNotesQueryOptions): Promise<any>`
  - TODO: Implement fetching user\'s favorite notes with pagination. Query User and Note models. Define proper return type for pagination.
- `public async addNoteToFavorites(userId: string, noteId: string): Promise<void>`
  - TODO: Validate noteId exists and is public/accessible if necessary before adding to favorites.

### `NoteService.ts`

- `public async uploadNoteFile(noteId: string, userId: string, file: Express.Multer.File): Promise<INote | null>`
  - TODO: Implement actual file upload to cloud storage (e.g., Cloudinary, S3) if this backend route is to be used for direct backend uploads. Update note document with file URL, size, type, publicId, assetId from storage service response.
- `public async getNotesByFilters(filters: any): Promise<INote[]>`
  - TODO: Robustly parse and apply complex filters. Current implementation is a basic placeholder.
- `public async generateAISummaryForNote(noteId: string, userId: string): Promise<Partial<INote> | null>`
  - TODO: Further refine AI summary generation. Ensure robust error handling for text extraction and AI service calls. Review prompt engineering for optimal summaries.
- `public async generateAIFlashcardsForNote(noteId: string, userId: string): Promise<Pick<INote, \'flashcards\'> | null>`
  - TODO: Further refine AI flashcard generation. Ensure robust error handling for text extraction and AI service calls. Improve JSON parsing. Review prompt engineering.

### `BadgeService.ts`

- `public async getAllActiveBadges(query: QueryOptions): Promise<IBadge[]>`
  - TODO: Implement proper pagination and filtering based on query options.
- `public async getBadgesByCategory(categoryName: string, query: QueryOptions): Promise<IBadge[]>`
  - TODO: Implement pagination and ensure `categoryName` is validated against `BadgeCategory` enum (if defined in `Badge.ts`).
- `public async getBadgesByRarity(rarityLevel: string, query: QueryOptions): Promise<IBadge[]>`
  - TODO: Implement pagination and ensure `rarityLevel` is validated against `BadgeRarity` enum (if defined in `Badge.ts`).
- `public async checkAndAwardBadges(userId: string, event: string, eventData?: any): Promise<IBadgeEarned[]>`
  - TODO: This is a core gamification logic. Continue to test and refine badge criteria checking against user data and events.


## Mass refactoring To Do comments/placeholders

### Backend

#### `backend/src/services/UserService.ts`

**1. getUsers**
- **Current:** `// TODO: Implement pagination and filtering if necessary for admin views`
- **What needs to be done:** Add pagination (page, limit) and filtering (by role, status, etc.) for admin or user management views. Currently returns all users without pagination.

**2. getUserActivityLog**
- **Current:**
  - `// TODO: Implement actual fetching of user activity log with pagination and filtering`
- **What needs to be done:** Implement proper querying of the user\'s activity array, with pagination, filtering by type, and sorting. Currently just sorts and slices the array in-memory.

**3. getUserUploadedNotes**
- **Current:**
  - `// TODO: Implement fetching user\'s uploaded notes with pagination and filtering`
- **What needs to be done:** Possibly add more advanced filtering (by subject, grade, etc.) and optimize for large datasets.

**4. getUserFavoriteNotes**
- **Current:**
  - `// TODO: Implement fetching user\'s favorite notes with pagination`
- **What needs to be done:** Add more advanced filtering and possibly sorting (by date added, rating, etc.).

**5. addNoteToFavorites**
- **Current:** `// TODO: Validate noteId exists and is public/accessible if necessary`
- **What needs to be done:** Add validation to ensure the note exists and is public before adding to favorites.

---

#### `backend/src/services/NoteService.ts`

**1. uploadNoteFile**
- **Current:**
  - `// This is a placeholder. Actual implementation will involve...`
- **What needs to be done:** Implement actual file upload logic to Cloudinary or S3 if this backend route is to be used for direct backend uploads. Handle errors, and update the note with real file metadata. Current primary flow is frontend-direct upload.

**2. getNotesByFilters**
- **Current:**
  - `// This is a placeholder. Implementation depends on how \'filters\' string is structured...`
- **What needs to be done:** Define and document the expected filter format (likely JSON), add validation, and possibly support more advanced filtering (e.g., ranges, text search).

**3. generateAISummaryForNote**
- **Current:**
  - `// Attempts actual text extraction and OpenAI call.`
- **What needs to be done:** Further refine AI summary generation. Ensure robust error handling for text extraction and AI service calls. Review prompt engineering for optimal summaries.

**4. generateAIFlashcardsForNote**
- **Current:**
  - `// Attempts actual text extraction and OpenAI call.`
- **What needs to be done:** Further refine AI flashcard generation. Ensure robust error handling for text extraction and AI service calls. Improve JSON parsing. Review prompt engineering.

---

#### `backend/src/services/AuthService.ts` (Note: This file may not exist, auth logic might be in UserController/UserService or directly in authRoutes)

- **Current:**
  - `// Placeholder for other auth methods (login, logout, etc.)` (This comment was at the end of the old `AuthService.ts` if it existed)
  - Frontend `useAuth.ts` now calls actual backend API endpoints.
- **What needs to be done:** Review if any additional authentication methods are needed on the backend (e.g., OAuth, multi-factor, etc.). Ensure all called auth endpoints (`/auth/login`, `/auth/register`, `/auth/profile`, `/auth/logout`) are robust.

---

#### `backend/src/models/User.ts`

- **Current:**
  - `// Can be a sub-document if not needing _id, or just an object type`
  - `// Sub-document or object type`
- **What needs to be done:** (Ongoing design consideration) Review if sub-document types (like `IUserBadge`, `IUserActivity`) should be refactored for performance or clarity as the application scales. Normalization seems okay for now.

---

### Frontend

#### `frontend/src/features/notes/useNote.ts`

- **Current:**
  - `// Add tags for Cloudinary if needed, from metadata.tags or derived`
  - `// Type assertion for the backend payload, or define a specific type`
- **What needs to be done:** Consider improving tag handling for uploads and define a stricter type for backend payloads if current `any` cast is problematic.

---

#### `frontend/src/features/notes/NoteUploader.tsx`

- **Current:**
  - `// Define subjects array - can be moved to a config file later`
- **What needs to be done:** Move the hardcoded subjects array (if still present and hardcoded) to a config file or fetch from backend for maintainability.

---

#### `frontend/src/features/notes/components/AISummarizer.tsx` and `frontend/src/features/notes/components/FlashcardGenerator.tsx`

- **Current:** No explicit TODOs, but depend on backend AI endpoints.
- **What needs to be done:** Once backend AI endpoints are fully robust and tested, ensure these components handle the response structure and errors gracefully. Continue UI/UX refinement.

---

## Summary Table of Detailed TODOs

| File                                      | Line/Method                  | Current Placeholder/Comment                                                                 | What Needs To Be Done                                                                                 |
|--------------------------------------------|------------------------------|--------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| backend/src/services/UserService.ts        | getUsers                     | `// TODO: Implement pagination and filtering if necessary for admin views`                 | Add pagination and filtering for admin/user management.                                               |
| backend/src/services/UserService.ts        | getUserActivityLog           | `// TODO: Implement actual fetching of user activity log with pagination and filtering`    | Implement proper querying, pagination, and filtering.                                                 |
| backend/src/services/UserService.ts        | getUserUploadedNotes         | `// TODO: Implement fetching user\'s uploaded notes with pagination and filtering`           | Add advanced filtering and optimize for large datasets.                                               |
| backend/src/services/UserService.ts        | getUserFavoriteNotes         | `// TODO: Implement fetching user\'s favorite notes with pagination`                         | Add advanced filtering and sorting.                                                                   |
| backend/src/services/UserService.ts        | addNoteToFavorites           | `// TODO: Validate noteId exists and is public/accessible if necessary`                    | Add validation for note existence and accessibility.                                                  |
| backend/src/services/NoteService.ts        | uploadNoteFile               | Placeholder for backend file upload (console logs removed). Primary is frontend direct.  | Implement if backend direct upload is needed.                                                         |
| backend/src/services/NoteService.ts        | getNotesByFilters            | Placeholder for filter parsing (console log removed).                                        | Define filter format, add validation, and support advanced filtering.                                 |
| backend/src/services/NoteService.ts        | generateAISummaryForNote     | Attempts actual AI call.                                                                   | Further refine, robust error handling, prompt engineering.                                            |
| backend/src/services/NoteService.ts        | generateAIFlashcardsForNote  | Attempts actual AI call.                                                                   | Further refine, robust error handling, JSON parsing, prompt engineering.                              |
| frontend/src/features/notes/NoteUploader.tsx| Top of file (if applicable)  | `// Define subjects array - can be moved to a config file later`                           | Move subjects array to a config file or fetch dynamically.                                              |
| frontend/src/features/notes/useNote.ts     | uploadNote                   | Comments about tags and backend payload typing                                             | Improve tag handling and define stricter backend payload type if needed.                              |
| backend/src/models/User.ts                 | Interface comments           | Comments about sub-document vs. object type                                                | (Ongoing design) Review sub-document types for scalability.                                         |
| backend/src/services/AuthService.ts (or equivalent) | N/A                 | Frontend useAuth now calls backend.                                                        | Review if additional backend auth methods are needed; ensure endpoint robustness.                     |
| frontend/src/features/notes/components/AISummarizer.tsx, FlashcardGenerator.tsx | N/A | No explicit TODOs, but depend on backend AI endpoints                                      | Continue UI/UX refinement and error handling as backend AI evolves.                                   |

---

# Completed Tasks

This section mirrors the "Completed" tasks from the old `CurrentTasks.md` and any major tasks completed from `TODO_Placeholders.md`.

## General Project Milestones
- [x] Backend TypeScript migration
- [x] Backend MVC architecture implementation
- [x] Frontend auth feature refactoring
  - [x] Created `frontend/src/features/auth/` folder
  - [x] Migrated Login and Register components to TypeScript
  - [x] Implemented AuthContext and useAuth hook
  - [x] Added route protection with PrivateRoute
  - [x] Defined TypeScript interfaces for auth types

## Task 7: Frontend Polish and Navigation Rewrite
Status: COMPLETED
(Details as previously listed in `TODO_Placeholders.md`)

## Task 8: Final Refactor & Schema Validation
Status: COMPLETED
Key actions performed:
- **Frontend Cleanup:**
  - Verified `apiClient.ts` usage in `useNote.ts` and `useUser.ts`.
  - Refactored `useAuth.ts` to use `apiClient.ts`.
  - Removed empty `usePDFNote.ts`.
  - Confirmed no unexpected `.js` files in `frontend/src`.
  - Reviewed and left intentional `console.log`/`debug`/`error` statements; others removed implicitly or confirmed not present in active code.
- **Backend Cleanup:**
  - Confirmed Controller -> Service -> Model separation (example: Notes).
  - Verified no unexpected `.js` files in `backend/src`.
  - Cloudinary uploads primarily frontend-direct; backend cleanup script is separate. Placeholder backend upload route logs cleaned.
  - Badge awarding logic confirmed to be centralized in `BadgeService.ts`.
  - Removed various `console.log` statements from services and server files.
- **DB Schema Documentation & Normalization:**
  - Generated `docs/schema.md` with details for User, Note, and Badge collections.
  - Confirmed models generally follow good normalization practices.
- **README Documentation:**
  - Updated `frontend/README.md` and `backend/README.md` with stack, folder structure, setup instructions (including `.env` locations), and pointers to `docs/schema.md`.

## **TASK 9: AI Enhancement, UX Polish & Final Integration**

### **Objective:**

Finalize advanced features by refining AI-powered tools, enhancing UI/UX consistency, improving error handling, solidifying type safety, and ensuring smooth user workflows. This is the final stage before testing, optimization, and security in Task 10.

---

## **PART 1: AI FEATURE FINALIZATION**

**Goal:** Make AI summarizer and flashcard generator production-ready.

### A. AI Summarizer (`AISummarizer.tsx`, `NoteService.ts`)

* [x] Improve error handling (UI + backend)
* [x] Add spinner/loading + fallback message
* [x] Gracefully handle: empty summary, OpenAI downtime, file parsing errors
* [x] Add "Last Generated" timestamp
* [x] Confirm response schema: `note.summary` is updated directly
* [x] Display OpenAI usage badge/icon if AI is used (optional enhancement)

### B. Flashcard Generator (`FlashcardGenerator.tsx`, `NoteService.ts`)

* [x] Show loading and handle timeouts/errors
* [x] Improve JSON parsing robustness (AI often returns malformed arrays)
* [x] Validate flashcard schema before saving (`question`, `answer`, `tag`)
* [x] Display generated flashcards before save (preview modal or section)
* [x] Allow user to discard or modify before confirming save

---

## **PART 2: FRONTEND POLISH & UX REFINEMENTS**

### A. Notes Dashboard / View Page

* [x] Show AI summary and flashcards clearly on note view
* [x] Allow regeneration of AI content if previously generated
* [x] Highlight "AI Generated" sections visually
* [x] Handle empty flashcards or summary gracefully (e.g., "Not generated yet")

### B. NoteUploader.tsx

* [x] Move hardcoded `subjects` array to a config file or fetch from backend
* [x] Add optional tags, title validation, and upload size feedback

---

## **PART 3: TYPE SAFETY & UTIL CONSISTENCY**

* [x] Audit `useNote.ts`, `AISummarizer.tsx`, `FlashcardGenerator.tsx` and others to:

  * Add strict types for API responses
  * Use `Note`, `User`, and `Flashcard` interfaces consistently
* [x] Move reused types to `sharedTypes.ts` (if not already existing) - (Decided to keep types feature-specific for now, but audited for consistency)
* [x] Replace `any` and untyped responses
* [x] Ensure consistent typing between backend services and frontend consumers

---

## **PART 4: CONTEXTUAL REFINEMENTS FOR NEXT TASKS**

**Plan ahead for Task 10 by laying groundwork here:**

* [x] Add toast or alert feedback system (success/failure, AI complete, etc.)
* [x] Add basic loading state to all async calls (especially AI, upload, and profile actions)
* [x] Refactor magic strings ("summary", "flashcards") into constants
* [x] Ensure Cloudinary-uploaded notes show preview (PDF/Image detection fallback) - (Improved in NoteCard, full solution pending backend thumbnail storage)

---

## **DELIVERABLES AFTER TASK 9**

1. Fully functioning AI summarization & flashcard generation with robust UI/UX.
2. Strict typing and error handling across all AI-related flows.
3. Config-based subject/tags structure and input validation.
4. Updated TODOs and clear audit trail of changes.
5. Foundational elements for Task 10 (feedback system, loading states).

---

## Task 10: AI Quota Management, Feedback, and Analytics Dashboard
**Status: COMPLETED (Core functionality)**

**Objective:** Build a complete AI usage tracking and feedback system tied to user analytics and gamification.

**Summary of Implementations:**

**Part 1: AI Quota Enforcement & Refill System (Backend)**
- **User.ts Schema:**
    - [x] Confirmed and refactored `aiUsage` field to `{ summaryUsed: number; flashcardUsed: number; lastReset: Date; }`.
- **Quota Checking Utility (UserService.ts):**
    - [x] Implemented `checkUserQuota(userId, type)`:
        - Enforces max usage (constants from `aiConfig.ts`: 3 summaries, 5 flashcards/day).
        - Resets `aiUsage` daily (based on `QUOTA_RESET_HOURS`).
        - Throws `QuotaExceededError` (from `customErrors.ts`).
    - [x] Implemented `incrementAIUsage(userId, type)` in `UserService.ts`.
- **Integration (NoteService.ts):**
    - [x] Integrated `checkUserQuota` and `incrementAIUsage` into `generateAISummaryForNote` and `generateAIFlashcardsForNote`.
- **Admin/Subscription Bypass:**
    - [x] Included basic structure for admin bypass in `checkUserQuota`. Premium bypass noted as optional.

**Part 2: Frontend Quota Display & Feedback**
- **AIQuotaDisplay.tsx:**
    - [x] Updated to use new `aiUsage` structure (`summaryUsed`, `flashcardUsed`).
    - [x] Fetches limits from frontend `config/aiConfig.ts`.
    - [x] Shows summary and flashcard usage + remaining uses.
    - [x] Color-coded feedback for progress bars (green, yellow, red).
    - [x] Tooltip and text indicating daily refresh of quotas.
    - [x] Added warning messages for "1 use remaining" and "None left".
- **Hook into useUser.ts (via UserProfile type):**
    - [x] `userTypes.ts` updated for `AIUsage` and `UserStreak`.
    - [x] `AuthService.ts` (backend) updated to return correct `aiUsage` and `streak` objects in user profile.
    - [x] `useUser.ts` (frontend) now receives correctly structured profile data. Assumed that components triggering AI generation call `fetchUserProfile` to update UI.
- **Toast Alerts:**
    - [x] Foundation laid: `QuotaExceededError` is thrown by backend and can be caught by frontend API handlers.
    - [ ] TODO: Explicitly implement toast notifications in AI feature components (e.g., `AISummarizer.tsx`, `FlashcardGenerator.tsx`) to catch these errors and display toasts using `useToast`.

**Part 3: Gamified Feedback & Streak System**
- **Streak Field in User.ts:**
    - [x] Confirmed and refactored `streak` field to `{ current: number; max: number; lastUsed: Date; }`.
- **Streak Logic (UserService.ts):**
    - [x] Implemented `updateUserAIStreak(userId)` in `UserService.ts`:
        - Increments streak if AI used on consecutive days.
        - Resets streak if gap in usage.
        - Updates `lastUsed` and `max` streak.
    - [x] Integrated into `NoteService.ts` AI generation methods.
- **Frontend Display (ProfilePage.tsx, UserStatsCard.tsx):**
    - [x] `UserStatsCard.tsx` updated to use `profile.streak` object.
    - [x] `ProfilePage.tsx` displays "AI Usage Streak: X days" using `profile.streak.current`.
- **Reward Integration:**
    - [ ] TODO: Implement backend logic in `BadgeService.ts` (or similar) to award XP or specific badges for AI usage streaks (e.g., "AI Streaker" badge for 3-day streak).
    - [ ] TODO: Define and create new AI-related badges in the `Badge` model and `BadgeService`.

**Part 4: Analytics Dashboard Enhancements (ProfilePage.tsx)**
- **Mini Analytics Cards:**
    - [x] Added cards for "AI Usage Streak", "AI Summaries Used Today", "AI Flashcards Used Today".
- **XP Progress Bar:**
    - [x] Covered by existing `UserStatsCard.tsx`.
- **Badge Grid Update:**
    - [x] `ProfilePage.tsx` includes `BadgeGrid`.
    - [ ] TODO: Integrate new AI-specific badges into the grid once they are implemented on the backend and earnable. Placeholder comment added in `ProfilePage.tsx`.

**New TODOs from Task 10:**
- **Frontend:**
    - [x] Explicitly implement toast notifications in AI feature components (e.g., `AISummarizer.tsx`, `FlashcardGenerator.tsx`) for quota errors and success messages, using `useToast` and refreshing user profile via `fetchUserProfile`. (Covered by Task 11 new badge toasts and profile refresh).
- **Backend:**
    - [x] Implement `BadgeService` logic to define and award new AI-related badges (e.g., "AI Streaker," "Summarizer Adept," "Flashcard Fanatic"). (Covered by Task 11)
    - [x] Create corresponding `Badge` documents in the database for these new AI badges. (Covered by Task 11 - definitions provided, seeding/manual entry required)
- **Analytics:**
    - [x] Consider adding lifetime total AI usage stats to `User` model if desired (current stats are daily/periodic). (Added `totalSummariesGenerated`, `totalFlashcardsGenerated` in Task 11)

---

## Task 11: Badge System Revamp (Gamified XP & Achievements)
**Status: COMPLETED (Core functionality & Optional Filtering)**

**Objective:** Refactor the Badge system to support tiered achievements, dynamically award XP, and reflect AI-related milestones in real-time on the user dashboard.

**Summary of Implementations:**

**Part 1: Backend Enhancements (Badge Model & Awarding Logic)**
- **Badge.ts Model:**
    - [x] Added `level: 'bronze' | 'silver' | 'gold' | 'platinum'` as a required field.
    - [x] `xpReward: number` field was already present.
    - [x] Added `'ai'` to `category` enum.
- **New AI-Specific Badges Defined (Requires seeding/DB entry):**
    - [x] AI Novice (Generate 3 summaries in 3 days, Bronze, +50 XP)
    - [x] Flashcard Fanatic (Generate 5 sets in 5 days, Silver, +75 XP)
    - [x] Streaker (Maintain 5-day AI usage streak, Gold, +100 XP)
    - [x] Summarizer Master (Generate 15 summaries lifetime, Platinum, +150 XP)
    - [x] Flashcard Legend (Generate 25 flashcard sets lifetime, Platinum, +200 XP)
- **User.ts Model:**
    - [x] Added `totalSummariesGenerated: number` and `totalFlashcardsGenerated: number` for lifetime AI usage tracking.
    - [x] Added `'ai_summary_generated'` and `'ai_flashcards_generated'` to `IUserActivity` action enum.
- **UserService.ts:**
    - [x] `incrementAIUsage` updated to increment lifetime total AI counts.
- **BadgeService.ts:**
    - [x] `BadgeCriteriaMap` updated with criteria functions for new AI badges (checking total counts, streaks, and activity logs for time-based challenges).
    - [x] `checkAndAwardBadges(userId, eventType, eventData)` refactored to:
        - Track and validate cumulative and time-based achievements against all relevant, unearned, active badges.
        - Award XP based on `xpReward` and update user level.
        - Prevent duplicate awarding.
        - Push awarded badges to `user.badges`.
        - Populate and return details of newly awarded badges (`IBadgeEarned[]` with populated `badge` field).

**Part 2: Integration into AI Flow (NoteService.ts)**
- [x] After AI generation (`generateAISummaryForNote`, `generateAIFlashcardsForNote`):
    - User activity logged (`ai_summary_generated`, `ai_flashcards_generated`).
    - `userService.updateUserAIStreak()` called (which saves user).
    - `badgeService.checkAndAwardBadges()` called for AI action and AI streak.
- [x] `NoteService` AI generation methods updated to return `AIGenerationResponse<T>` which includes `data` and `newlyAwardedBadges` (populated with name, icon, level, xpReward).

**Part 3: Frontend Enhancements**
- **Type Definitions (`userTypes.ts`, `noteTypes.ts`):**
    - [x] `UserBadge` in `userTypes.ts` updated with `level`, `xpReward`, `icon`, `category`, `rarity`.
    - [x] `NewlyAwardedBadgeInfo` and `AIGenerationResult` types added to `noteTypes.ts`.
- **Badge Display (`BadgeGrid.tsx`):**
    - [x] Displays badge level with color-coding/icons and text.
    - [x] Shows `xpReward` for each badge.
    - [x] Highlighting for newly earned badges maintained.
- **Visual Feedback (AISummarizer.tsx, FlashcardGenerator.tsx):**
    - [x] `useNote.ts` updated for new `AIGenerationResult` structure.
    - [x] Components now handle `newlyAwardedBadges` from AI generation hook response.
    - [x] On new badge award: `fetchUserProfile()` is called to update profile data.
    - [x] Custom toast notification shown for each newly awarded badge, displaying name, level, and XP.
- **Analytics Cards (`ProfilePage.tsx`):**
    - [x] Added cards for: "Total badges earned", "XP earned from badges", "Highest badge tier unlocked".

**Part 4: Optional (Stretch Goals)**
- **Badge Filtering UI (`BadgeGrid.tsx`):**
    - [x] Added dropdown filters for badge `level` and `category`.
    - [x] Displays a message if no badges match filters.
- **Badge Sorting:** [ ] Not implemented.
- **Lifetime Badge Analytics:** Partially covered by new profile cards. More detailed analytics can be a future task.

**New TODOs from Task 11:**
- **Backend:**
    - Seed the database with the new AI-specific badge definitions (AI Novice, Flashcard Fanatic, Streaker, Summarizer Master, Flashcard Legend) ensuring their slugs match `BadgeCriteriaMap` keys.
- **Frontend:**
    - Consider refining toast notifications for new badges (e.g., consolidating multiple new badges into one toast if awarded simultaneously, or using the `BadgeGrid`'s `newBadgeIds` prop more directly if a shared state for new badges is implemented).
    - Implement badge sorting in `BadgeGrid.tsx` (by rarity, date earned, etc.).
    - Test responsiveness and UI of new filter controls in `BadgeGrid.tsx`.

---
**This document should be kept up to date as TODOs are resolved or new placeholders are added during the refactoring process.** 