import React, { useEffect } from 'react';
import socketService from '../services/socketService';
import AdminBadge from '../components/AdminBadge';

const LeaderboardScreen = ({ setPage, leaderboard = [] }) => {
  useEffect(() => { socketService.requestLeaderboard(); }, []);
  const list = Array.isArray(leaderboard) ? leaderboard : [];
  return (
    <div className="min-h-screen p-8 bg-gray-900 text-gray-200">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-emerald-400">Таблица лидеров</h1>
        <button onClick={() => setPage('lobby')} className="bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600">Вернуться в лобби</button>
      </header>
      <div className="max-w-4xl mx-auto bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-gray-700">
              <th className="p-4 text-lg">#</th>
              <th className="p-4 text-lg">Игрок</th>
              <th className="p-4 text-lg">Рейтинг</th>
              <th className="p-4 text-lg">Побед</th>
            </tr>
          </thead>
          <tbody>
            {list.map((user, index) => (
              <tr key={user.id || index} className={`border-b border-gray-700 ${index < 3 ? 'text-yellow-300' : ''}`}>
                <td className="p-4 font-bold text-xl">{index + 1}</td>
                <td className="p-4 font-semibold text-xl flex items-center gap-4">
                  <img className="w-12 h-12 rounded-full" src={`https://placehold.co/48x48/1f2937/ffffff?text=${String(user.username || '?').charAt(0)}`} alt="avatar" />
                  <span className="flex items-center gap-1">
                    {user.username || '—'}
                    {user.role === 'admin' && <AdminBadge />}
                  </span>
                </td>
                <td className="p-4 font-bold text-xl">{user.rating ?? 0}</td>
                <td className="p-4 font-semibold text-xl text-green-500">{user.stats?.wins ?? 0}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-gray-400">Пока пусто</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardScreen;
