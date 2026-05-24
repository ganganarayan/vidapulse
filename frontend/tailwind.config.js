/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // VidaPulse brand palette
        brand: {
          DEFAULT: '#F59E0B',
          dark   : '#D97706',
          light  : '#FDE68A',
        },
      },
    },
  },
  plugins: [],
};
