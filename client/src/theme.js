export function setTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add('light');
    root.classList.remove('classic');
  } else if (theme === 'classic') {
    root.classList.add('classic');
    root.classList.remove('light');
  } else {
    root.classList.remove('light', 'classic');
  }
}

export function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark' || stored === 'classic') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
