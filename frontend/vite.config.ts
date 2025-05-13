/// <reference types="vitest" />
import { defineConfig as defineViteConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
const viteConfig = defineViteConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Generate source maps for better debugging of production issues
    sourcemap: true,
    // Improve CSS handling in production
    cssCodeSplit: true,
    // Set a reasonable chunk size
    chunkSizeWarningLimit: 1000,
    // Optimize output
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React dependencies into a separate vendor chunk
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Split UI libraries
          ui: ['react-icons', 'framer-motion', 'react-hot-toast'],
        },
      },
    },
  },
  // More friendly error overlay
  server: {
    hmr: {
      overlay: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});

const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true, // if you have CSS imports in your components
    coverage: {
      provider: 'istanbul', // or 'c8'
      reporter: ['text', 'json', 'html', 'lcov'], // Add lcov for services like Codecov
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx', 
        'src/vite-env.d.ts',
        'src/setupTests.ts',
        'src/**/types.ts', // Exclude type definition files
        'src/**/constants.ts', // Exclude constant definition files
        'src/App.tsx', // Often App.tsx is mostly setup, can be excluded if not much logic
        'src/router/', // Router configuration files
      ],
      all: true, // Ensure coverage is reported for all files, not just tested ones
      thresholds: { // Nesting thresholds
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      }
    },
  },
});

export default mergeConfig(viteConfig, vitestConfig); 