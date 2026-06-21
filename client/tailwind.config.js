/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Core — dark green-black theme
        ink:      '#E8F5E8',   // primary text (near-white, green tint)
        inkmuted: '#7AAE7A',   // secondary text
        paper:    '#060A06',   // page background (near-black)
        surface:  '#0D160D',   // card background
        elevated: '#142014',   // elevated card
        line:     '#1A2E1A',   // borders
        // Primary action — bright green
        amber:    '#22C55E',
        ambersoft:'#0A2010',
        // Success / delivered — lighter green
        teal:     '#4ADE80',
        tealsoft: '#052E16',
        // Danger
        danger:   '#F87171',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body:    ['"Inter"', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        xl: '14px',
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease',
        'slide-up':  'slideUp 0.3s ease',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
        'glow':      'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 },              to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
        glow:     { from: { boxShadow: '0 0 8px rgba(34,197,94,0.2)' }, to: { boxShadow: '0 0 22px rgba(34,197,94,0.45)' } },
      },
      backgroundImage: {
        'green-glow': 'radial-gradient(ellipse at top, rgba(34,197,94,0.08) 0%, transparent 60%)',
        'card-shine': 'linear-gradient(135deg, rgba(34,197,94,0.04) 0%, transparent 60%)',
      },
      boxShadow: {
        'green-sm': '0 0 0 1px rgba(34,197,94,0.2)',
        'green-md': '0 0 16px rgba(34,197,94,0.25)',
        'green-lg': '0 0 32px rgba(34,197,94,0.3)',
        'card':     '0 1px 3px rgba(0,0,0,0.5)',
        'card-hover':'0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,197,94,0.15)',
      },
    },
  },
  plugins: [],
};
