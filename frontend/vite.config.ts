/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'types': path.resolve(__dirname, './src/types'),
      'utils': path.resolve(__dirname, './src/utils'),
      'models': path.resolve(__dirname, './src/models'),
      'services': path.resolve(__dirname, './src/services'),
      'hooks': path.resolve(__dirname, './src/hooks'),
      'components': path.resolve(__dirname, './src/components'),
      'features': path.resolve(__dirname, './src/features'),
      'config': path.resolve(__dirname, './src/config')
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Keep the giant, rarely-changing libraries in their own cacheable
        // chunks instead of the main bundle.
        manualChunks: {
          pdf: ['pdfjs-dist', '@react-pdf-viewer/core', '@react-pdf-viewer/default-layout'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'axios'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Test configuration lives in vitest.config.ts (which vitest prefers over
  // this file) - keep a single source of truth.
}); 