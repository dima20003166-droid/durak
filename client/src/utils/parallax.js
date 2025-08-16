// client/src/utils/parallax.js
export function updateParallax(x, y) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--parallax-x', `${x}px`);
  root.style.setProperty('--parallax-y', `${y}px`);
}
