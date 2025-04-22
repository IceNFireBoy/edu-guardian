/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
  plugins: [],
} 