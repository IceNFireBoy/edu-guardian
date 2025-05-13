/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5', // indigo-600
          light: '#6366f1',   // indigo-500
          dark: '#4338ca',    // indigo-700
        },
        secondary: {
          DEFAULT: '#64748b', // slate-500
          light: '#94a3b8',   // slate-400
          dark: '#475569',    // slate-600
        },
      },
    },
  },
  plugins: [
    // Plugin for 3D transforms needed for flashcard flip
    plugin(function({ addUtilities }) {
      addUtilities({
        '.perspective': {
          'perspective': '1000px',
        },
        '.preserve-3d': {
          'transform-style': 'preserve-3d',
        },
        '.rotate-y-180': {
          'transform': 'rotateY(180deg)',
        },
        '.backface-hidden': {
          'backface-visibility': 'hidden',
        },
      })
    }),
    // require('@tailwindcss/forms'), // Add other plugins if needed
    // require('@tailwindcss/typography'), 
  ],
} 