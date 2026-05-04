/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        ipl: {
          blue:   '#1a2980',
          purple: '#26186c',
          gold:   '#f7b731',
          orange: '#F26522',
          dark:   '#0a0a14',
          card:   '#12122a',
          glass:  'rgba(255,255,255,0.05)',
        },
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up':   'slideUp 0.4s ease-out',
        'glow':       'glow 2s ease-in-out infinite alternate',
        'timer-ring': 'timerRing 1s ease-in-out infinite',
      },
      keyframes: {
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        glow:    { '0%': { boxShadow: '0 0 5px rgba(247,183,49,0.3)' }, '100%': { boxShadow: '0 0 20px rgba(247,183,49,0.8)' } },
      },
    },
  },
  plugins: [],
};
