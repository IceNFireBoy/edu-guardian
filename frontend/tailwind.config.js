/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const defaultTheme = require('tailwindcss/defaultTheme');

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['InterVariable', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Brand: violet with a full scale; pair with the amber accent for
        // streak/XP highlights. Gradient identity: from-primary to-indigo-600.
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          DEFAULT: '#7c3aed', // violet-600
          light: '#8b5cf6',   // violet-500
          dark: '#6d28d9',    // violet-700
        },
        accent: {
          DEFAULT: '#f59e0b', // amber-500
          light: '#fbbf24',   // amber-400
          dark: '#d97706',    // amber-600
        },
        secondary: {
          DEFAULT: '#64748b', // slate-500
          light: '#94a3b8',   // slate-400
          dark: '#475569',    // slate-600
        },
      },
      boxShadow: {
        // Soft layered card shadow for the elevated look
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 16px -4px rgb(0 0 0 / 0.08)',
        'card-hover': '0 4px 8px -2px rgb(0 0 0 / 0.08), 0 12px 32px -8px rgb(124 58 237 / 0.18)',
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