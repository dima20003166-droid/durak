import socketService from '../services/socketService';

export const resolveAvatarUrl = (url, placeholder, base = null) => {
  const s = (url || '').toString().trim();
  if (!s) return placeholder;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const root =
    base ||
    (typeof socketService?.getServerUrl === 'function'
      ? socketService.getServerUrl()
      : 'http://localhost:4000');
  return s.startsWith('/') ? root + s : s;
};

export default resolveAvatarUrl;

