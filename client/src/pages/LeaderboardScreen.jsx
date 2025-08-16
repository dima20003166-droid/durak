import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import socketService from '../services/socketService';
import AdminBadge from '../components/AdminBadge';

const LeaderboardScreen = ({ setPage, leaderboard = [] }) => {
  useEffect(() => { socketService.requestLeaderboard(); }, []);
  const list = Array.isArray(leaderboard) ? leaderboard : [];

              </tr>
            </thead>
            <tbody>
              {list.map((user, index) => (
                <tr key={user.id || index} className={`border-b border-border ${index < 3 ? 'text-accent' : ''}`}>
                  <td className="p-4 font-bold text-xl">{index + 1}</td>
                  <td className="p-4 font-semibold text-xl flex items-center gap-4">
                    <img className="w-12 h-12 rounded-full" src={`https://placehold.co/48x48/1f2937/ffffff?text=${String(user.username || '?').charAt(0)}`} alt="avatar" />
                    <span className="flex items-center gap-1">
                      {user.username || '—'}
                      {user.role === 'admin' && <AdminBadge />}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-xl">{user.rating ?? 0}</td>
                  <td className="p-4 font-semibold text-xl text-primary">{user.stats?.wins ?? 0}</td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-muted">Пока пусто</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
};

export default LeaderboardScreen;

LeaderboardScreen.propTypes = {
  setPage: PropTypes.func.isRequired,
  leaderboard: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.any,
      username: PropTypes.string,
      rating: PropTypes.number,
      stats: PropTypes.object,
      role: PropTypes.string,
    })
  ),
};
