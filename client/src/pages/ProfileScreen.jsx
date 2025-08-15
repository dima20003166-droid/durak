// client/src/pages/ProfileScreen.jsx (file picker)
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import socketService from '../services/socketService';
import AdminBadge from '../components/AdminBadge';

const resolveAvatarUrl = (url, placeholder, base = null) => {
  const s = (url || '').toString().trim();
  if (!s) return placeholder;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const root = base || (typeof socketService?.getServerUrl === 'function' ? socketService.getServerUrl() : 'http://localhost:4000');
  return s.startsWith('/') ? (root + s) : s;
};


const ProfileScreen = ({ user, setPage }) => {
  const stats = user?.stats || { games: 0, wins: 0, losses: 0 };
  const total = (stats.wins||0) + (stats.losses||0);
  const winRate = total ? Math.round((stats.wins / total) * 100) : 0;
  const avatarSrc = resolveAvatarUrl(
    user?.avatarUrl,
    `https://placehold.co/160x160/1f2937/ffffff?text=${user?.username?.charAt(0) || 'U'}`
  );
  const fileRef = useRef(null);

  const onPick = () => fileRef.current?.click();
  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
      alert('Выберите PNG или JPG');
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      alert('Слишком большой файл (макс ~1.5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result; // data:image/...;base64,...
      socketService.updateAvatarFile(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
      <div className="min-h-screen p-8 bg-bg text-text">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold text-primary">Профиль игрока</h1>
          <button onClick={() => setPage('lobby')} className="bg-primary text-text font-bold py-2 px-4 rounded-lg hover:bg-primary/80">Вернуться в лобби</button>
        </header>
        <div className="max-w-4xl mx-auto bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex flex-col items-center">
              <img className="w-40 h-40 rounded-full border-4 border-primary object-cover" src={avatarSrc} alt="avatar" />
              <div className="mt-4 flex gap-3">
                <button onClick={onPick} className="text-sm text-primary hover:underline">Загрузить с устройства</button>
                <button onClick={() => {
                const url = window.prompt('Вставьте ссылку на изображение (PNG/JPG):', user?.avatarUrl || '');
                if (url) socketService.updateAvatar(url);
                }} className="text-sm text-primary hover:underline">Указать URL</button>
            </div>
            <input type="file" accept="image/png,image/jpeg" ref={fileRef} onChange={onFileChange} className="hidden" />
          </div>
          <div className="flex-grow w-full">
              <h2 className="text-4xl font-bold flex items-center gap-2">{user?.username}{user?.role === 'admin' && <AdminBadge />}</h2>
              <p className="text-lg text-muted">Рейтинг: {user?.rating}</p>
              <div className="mt-6 grid grid-cols-2 lg:grid-cols-3 gap-4 text-center">
                <div className="bg-surface p-4 rounded-lg transition-transform hover:scale-[1.02]"><p className="text-muted text-sm">Всего игр</p><p className="text-2xl font-bold">{total || 0}</p></div>
                <div className="bg-surface p-4 rounded-lg transition-transform hover:scale-[1.02]"><p className="text-muted text-sm">Победы</p><p className="text-2xl font-bold text-primary">{stats.wins || 0}</p></div>
                <div className="bg-surface p-4 rounded-lg transition-transform hover:scale-[1.02]"><p className="text-muted text-sm">Поражения</p><p className="text-2xl font-bold text-danger">{stats.losses || 0}</p></div>
                <div className="bg-surface p-4 rounded-lg col-span-2 lg:col-span-1 transition-transform hover:scale-[1.02]"><p className="text-muted text-sm">Процент побед</p><p className="text-2xl font-bold text-primary">{winRate}%</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ProfileScreen;

ProfileScreen.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    avatarUrl: PropTypes.string,
    stats: PropTypes.object,
    rating: PropTypes.number,
    role: PropTypes.string,
  }),
  setPage: PropTypes.func.isRequired,
};
