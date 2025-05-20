import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/setupVitest.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      './coverage/**',
      './logs/**',
      './test/data/**',
      '**/.{idea,git,cache,output,temp,tmp}/**',
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupVitest.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}); 