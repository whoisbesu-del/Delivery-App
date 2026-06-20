/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14213D',
        inkmuted: '#3A4A6B',
        paper: '#F3F5F7',
        surface: '#FFFFFF',
        line: '#E2E5EA',
        amber: '#FF6B35',
        ambersoft: '#FFE7DC',
        teal: '#2D9D78',
        tealsoft: '#DCF1E8',
        slate: {
          500: '#6B7280',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        xl: '14px',
      },
    },
  },
  plugins: [],
};
