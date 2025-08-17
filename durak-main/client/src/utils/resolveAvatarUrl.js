import socketService from '../services/socketService';

export default function resolveAvatarUrl(url, placeholder, base = null) {
  const s = (url || '').toString().trim();
  if (!s) return placeholder;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const root =
    base ||
    (typeof socketService?.getServerUrl === 'function'
      ? socketService.getServerUrl()
      : typeof window !== 'undefined' && typeof window.location !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}`
        : 'http://185.233.47.116:4000');
  return s.startsWith('/') ? root + s : s;
}
