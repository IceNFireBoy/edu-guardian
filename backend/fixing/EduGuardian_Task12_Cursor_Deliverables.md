# EduGuardian Task 12 – Cursor AI Import Guide

## ✅ Drop-In File Map

/tests/
├── services/
│   ├── UserService.test.ts
│   ├── BadgeService.test.ts
│   ├── NoteService.test.ts
│   └── AuthService.test.ts
├── controllers/
│   ├── userController.test.ts
│   ├── badgeController.test.ts
│   ├── noteController.test.ts
│   └── flashcardController.test.ts
├── frontend/
│   ├── AISummarizer.test.tsx
│   ├── FlashcardGenerator.test.tsx
│   ├── ProfilePage.test.tsx
│   └── BadgeGrid.test.tsx

## ✅ Commands to Run

```bash
pnpm install
pnpm run lint
pnpm run test:coverage
✅ Model Configuration

Model	Recommended
GPT-4 Turbo	✅ Yes
Claude / Gemini	❌ Not needed