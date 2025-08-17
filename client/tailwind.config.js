/** @type {import('tailwindcss').Config} */
export default {

  safelist: [
    'rotate-[-6deg]','rotate-[6deg]','rotate-[9deg]','rotate-[12deg]',
    'translate-x-4','-translate-y-2','-translate-x-1/2','-top-4',
    'w-8','h-12','w-20','h-28','w-28','h-40'
  ],

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
