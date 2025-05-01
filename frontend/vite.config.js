import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
  },
});
