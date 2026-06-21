/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode
        primary:   '#22C55E',
        'primary-dark': '#16A34A',
        // Dark surfaces
        dark:      '#060A06',
        'dark-2':  '#0D160D',
        'dark-3':  '#142014',
        'dark-border': '#1A2E1A',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body:    ['"Inter"', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
