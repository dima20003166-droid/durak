/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        burgundy: {50:'#f8e7ec',100:'#f0cfd9',200:'#e19fb3',300:'#d36f8e',400:'#c6406a',500:'#b81046',600:'#980e3a',700:'#7a0b2f',800:'#5c0823',900:'#3e0517',950:'#2f0411'},
        amber: {500:'#f59e0b',600:'#d97706'}
      },
      boxShadow: { glow: '0 0 24px rgba(248,113,113,0.35)', glowBurgundy: '0 0 28px rgba(186,16,70,0.45)' },
      backdropBlur: { xs: '2px' },
      screens: {
        xs: '480px',
      },
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
        danger: 'var(--color-danger)',
        'card-back': 'var(--color-card-back)',
        'wheel-red': 'var(--jackpot-red)',
        'wheel-orange': 'var(--jackpot-orange)',
        'neon-primary': 'var(--neon-primary)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Press Start 2P"', 'cursive'],
        neon: ['"Orbitron"', 'sans-serif'],
      },
      width: {
        'card-sm': '4rem',
        'card-md': '5.375rem',
        'card-lg': '6.5rem',
      },
      height: {
        'card-sm': '5.625rem',
        'card-md': '7.5rem',
        'card-lg': '9.125rem',
      },
      spacing: {
        'card-overlap-sm': '1.5rem',
        'card-overlap-md': '2rem',
        'card-overlap-lg': '2.5rem',
      },
      boxShadow: {
        card: '0 2px 4px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
};
