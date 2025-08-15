// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import socketService from './services/socketService';
import AuthScreen from './pages/AuthScreen';
import LobbyScreen from './pages/LobbyScreen';
import GameScreen from './pages/GameScreen';
import ProfileScreen from './pages/ProfileScreen';
import WalletScreen from './pages/WalletScreen';
import LeaderboardScreen from './pages/LeaderboardScreen';
import AdminPanel from './pages/AdminPanel';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { setTheme } from './theme';
import { pageVariants } from './animations/pageTransitions';

export default function App() {
  const [page, setPage] = useState('auth');
  const [suppressAutoJoinUntil, setSuppressAutoJoinUntil] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [siteSettings, setSiteSettings] = useState({ commission: 5, botsEnabled: true, maxPlayersLimit: 6 });
  const [theme, setThemeState] = useState('dark');

  useEffect(() => { setTheme(theme); }, [theme]);
  const toggleTheme = () => setThemeState(t => (t === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    socketService.connect();

    const onLoginSuccess = user => { setCurrentUser(user); setPage('lobby'); };
    const onUserUpdated = user => setCurrentUser(prev => ({ ...prev, ...user }));
    const onRooms = serverRooms => setRooms(serverRooms || []);
    const onLeaderboard = users => setLeaderboard(Array.isArray(users) ? users : []);
    const onSettings = settings => setSiteSettings(settings || { commission: 5, botsEnabled: true, maxPlayersLimit: 6 });

    socketService.on('login_success', onLoginSuccess);
    socketService.on('created_room', ({ roomId }) => {
      socketService.joinRoom(roomId);
    });
    socketService.on('user_data_updated', onUserUpdated);
    socketService.on('update_rooms', onRooms);
    socketService.on('leaderboard_data', onLeaderboard);
    socketService.on('admin_settings_data', onSettings);

    const handleRoomUpdate = updatedRoom => {
      if (Date.now() < suppressAutoJoinUntil) return;
      if (!updatedRoom) return;
      const inRoom = updatedRoom.players?.some(
        (p) => p.socketId === socketService.getSocketId(),
      );
      if (inRoom) {
        setCurrentRoom(updatedRoom);
        // переход в экран игры даже в статусе 'waiting', чтобы видеть стол
        setPage('game');
      }
    };

    const handleGameStarted = room => {
      if (Date.now() < suppressAutoJoinUntil) return;
      if (room?.players?.some((p) => p.socketId === socketService.getSocketId())) {
        setCurrentRoom(room);
        setPage('game');
      }
    };

    socketService.on('room_update', handleRoomUpdate);
    socketService.on('game_started', handleGameStarted);
    socketService.on('joined_room', (room) => {
      setCurrentRoom(room);
      setPage('game');
    });
    socketService.on('game_state_update', handleRoomUpdate);
    // Не редиректим здесь — модалка в GameScreen сама покажется
    socketService.on('game_over', () => {});

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setPage('auth');
    socketService.disconnect();
    socketService.connect();
  };

  const renderPage = () => {
    switch (page) {
      case 'lobby':
        return (
          <motion.div key="lobby" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <LobbyScreen
              user={currentUser}
              onLogout={handleLogout}
              setPage={setPage}
              rooms={rooms}
              siteSettings={siteSettings}
            />
          </motion.div>
        );
      case 'game':
        return (
          <motion.div key="game" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <GameScreen
              setSuppressAutoJoinUntil={setSuppressAutoJoinUntil}
              room={currentRoom}
              setPage={setPage}
            />
          </motion.div>
        );
      case 'profile':
        return (
          <motion.div key="profile" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <ProfileScreen user={currentUser} setPage={setPage} />
          </motion.div>
        );
      case 'wallet':
        return (
          <motion.div key="wallet" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <WalletScreen user={currentUser} setPage={setPage} />
          </motion.div>
        );
      case 'leaderboard':
        return (
          <motion.div key="leaderboard" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <LeaderboardScreen setPage={setPage} leaderboard={leaderboard} />
          </motion.div>
        );
      case 'admin':
        return (
          <motion.div key="admin" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <AdminPanel user={currentUser} setPage={setPage} siteSettings={siteSettings} />
          </motion.div>
        );
      default:
        return (
          <motion.div key="auth" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <AuthScreen setPage={setPage} setCurrentUser={setCurrentUser} />
          </motion.div>
        );
    }
  };

  // Live update of current user when admin changes balance/rank or after game results
  useEffect(() => {
    const handler = updated => {
      if (!updated) return;
      setCurrentUser(prev => (prev ? { ...prev, ...updated } : updated));
    };
    socketService.on('current_user_update', handler);
    return () => socketService.off('current_user_update', handler);
  }, []);

  return (
    <ErrorBoundary>
      <div className="bg-bg text-text min-h-screen relative">
        <AnimatePresence mode="wait">
          {renderPage()}
        </AnimatePresence>
        <button
          className="fixed bottom-4 right-4 px-3 py-2 rounded bg-primary text-text shadow-md"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
    </ErrorBoundary>
  );
}

App.propTypes = {};
