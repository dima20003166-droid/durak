/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
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
    },
  },
  plugins: [],
};
