/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  safelist: ["chatPanel", "rotate-[22deg]", "from-red-400/10", "to-orange-400/10"],
  theme: {
    extend: {
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
    },
  },
  plugins: [],
};
