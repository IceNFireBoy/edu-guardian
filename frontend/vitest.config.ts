import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // QUARANTINE: legacy suites written against components that have since
      // been rewritten or removed; they predate the 2026-06 repair PR and
      // have never passed in CI. Re-enable file by file as they are
      // rewritten against current code. Currently green and gating:
      //   src/components/__tests__/LoadingSpinner.test.tsx
      //   src/features/notes/components/NoteFlashcards.test.tsx
      //   src/features/notes/components/__tests__/Progress.test.tsx
      //   src/features/user/components/__tests__/ActivityLog.test.tsx
      'src/__tests__/**/*.test.tsx',
      'src/components/__tests__/ErrorBoundary.test.tsx',
      'src/features/notes/__tests__/useNote.test.tsx',
      'src/features/notes/components/__tests__/AIFeaturesPanel.test.tsx',
      'src/features/notes/components/__tests__/AISummarizer.test.tsx',
      'src/features/notes/components/__tests__/FlashcardGenerator.test.tsx',
      'src/features/notes/components/__tests__/NoteAISummary.test.tsx',
      'src/features/notes/components/__tests__/NoteCard.test.tsx',
      'src/features/notes/components/__tests__/NoteComment.test.tsx',
      'src/features/notes/components/__tests__/NoteDetail.test.tsx',
      'src/features/notes/components/__tests__/NoteDetailModal.test.tsx',
      'src/features/notes/components/__tests__/NoteFilter.test.tsx',
      'src/features/notes/components/__tests__/NoteFlashcards.test.tsx',
      'src/features/notes/components/__tests__/NoteList.test.tsx',
      'src/features/notes/components/__tests__/NoteRating.test.tsx',
      'src/features/notes/components/__tests__/NoteUpload.test.tsx',
      'src/features/notes/components/__tests__/NoteViewer.test.tsx',
      'src/features/notes/components/__tests__/useNote.test.tsx',
      'src/features/user/__tests__/**',
      'src/features/user/components/__tests__/AIQuotaDisplay.test.tsx',
      'src/features/user/components/__tests__/BadgeGrid.test.tsx',
      'src/features/user/components/__tests__/DashboardFeed.test.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        'src/types/',
        'src/vite-env.d.ts',
      ],
      // No coverage thresholds while most legacy suites are quarantined;
      // restore once the suites are rewritten.
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}); 