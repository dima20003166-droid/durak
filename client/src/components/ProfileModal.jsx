// client/src/components/ProfileModal.jsx
import React from 'react';
import PropTypes from 'prop-types';

const ProfileModal = ({ user, onClose }) => {
  if (!user) return null;

  const stats = user.stats || { games: 0, wins: 0, losses: 0 };
  const winRate = stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-bg/70 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-surface p-6 rounded-xl border border-border w-full max-w-md text-text" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-4">
          <img className="w-16 h-16 rounded-full object-cover" src={user.avatarUrl?.trim() || `https://placehold.co/64x64/1f2937/ffffff?text=${user.username?.[0] || 'U'}`} alt="avatar" />
          <div>
            <div className="text-xl font-bold">{user.username}</div>
            <div className="text-muted">Рейтинг: {user.rating ?? '—'}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <div className="bg-surface rounded p-2"><div className="text-xs text-muted">Игры</div><div className="text-lg font-bold">{stats.games || 0}</div></div>
          <div className="bg-surface rounded p-2"><div className="text-xs text-muted">Победы</div><div className="text-lg font-bold text-primary">{stats.wins || 0}</div></div>
          <div className="bg-surface rounded p-2"><div className="text-xs text-muted">Пораж.</div><div className="text-lg font-bold text-danger">{stats.losses || 0}</div></div>
        </div>
        <div className="text-center text-sm text-muted mt-2">Винрейт: {winRate}%</div>
        <div className="mt-6 text-right"><button onClick={onClose} className="px-4 py-2 bg-primary hover:bg-primary/80 rounded text-text">Закрыть</button></div>
      </div>
    </div>
  );
};

ProfileModal.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    avatarUrl: PropTypes.string,
    rating: PropTypes.number,
    stats: PropTypes.object,
  }),
  onClose: PropTypes.func.isRequired,
};

export default ProfileModal;