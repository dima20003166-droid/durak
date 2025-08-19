// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socketService from './services/socketService';
import LobbyScreen from './pages/LobbyScreen';
import GameScreen from './pages/GameScreen';
import ProfileScreen from './pages/ProfileScreen';
import WalletScreen from './pages/WalletScreen';
import LeaderboardScreen from './pages/LeaderboardScreen';
import AdminPanel from './pages/AdminPanel';
import JackpotGame from './pages/JackpotGame';
import ProvablyFair from './pages/ProvablyFair';
import ErrorBoundary from './components/ErrorBoundary';
import AuthModal from './components/AuthModal';
import './index.css';
import { setTheme, getInitialTheme } from './theme';
import { updateParallax } from './utils/parallax';
import { saveLastTableId, getLastTableId, clearLastTableId } from './shared/lib/rejoin';

export default function App() {
  const [page, setPage] = useState('lobby');
  const [suppressAutoJoinUntil, setSuppressAutoJoinUntil] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [siteSettings, setSiteSettings] = useState({ commission: 5, botsEnabled: true, maxPlayersLimit: 6 });
  const [theme, setThemeState] = useState(getInitialTheme());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

useEffect(() => {
    if (authChecked && currentUser && Date.now() > suppressAutoJoinUntil) {
        const lastTableId = getLastTableId();
        if (lastTableId) {
            const roomExists = rooms.some(r => r.id === lastTableId);
            if (roomExists) {
                console.log('Найден предыдущий стол, попытка переподключения:', lastTableId);
                socketService.joinRoom(lastTableId);
            } else {
                clearLastTableId();
            }
        }
    }
  }, [authChecked, currentUser, rooms, suppressAutoJoinUntil]);
  const toggleTheme = () => setThemeState(t => t === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    let raf;
    const handler = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => updateParallax(x, y));
    };
    window.addEventListener('mousemove', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;

    const handleAuthSuccess = () => {
      setAuthChecked(true);
      socketService.off('login_success', handleAuthSuccess);
      socketService.off('login_error', handleAuthError);
    };
    const handleAuthError = () => {
      setAuthChecked(true);
      socketService.off('login_success', handleAuthSuccess);
      socketService.off('login_error', handleAuthError);
    };

    const onLoginSuccess = ({ user, token }) => {
      setCurrentUser(user);
      if (token && typeof localStorage !== 'undefined') {
        localStorage.setItem('authToken', token);
      }
      setShowAuthModal(false);
      setPage('lobby');
    };
    const onUserUpdated = (user) => setCurrentUser((prev) => ({ ...prev, ...user }));
    const onRooms = (serverRooms) => setRooms(serverRooms || []);
    const onLeaderboard = (users) => setLeaderboard(Array.isArray(users) ? users : []);
    const onSettings = (settings) => setSiteSettings(settings || { commission: 5, botsEnabled: true, maxPlayersLimit: 6 });

    socketService.on('login_success', handleAuthSuccess);
    socketService.on('login_error', handleAuthError);
    socketService.on('login_success', onLoginSuccess);
    socketService.on('created_room', ({ roomId }) => { socketService.joinRoom(roomId); });
    socketService.on('user_data_updated', onUserUpdated);
    socketService.on('update_rooms', onRooms);
    socketService.on('leaderboard_data', onLeaderboard);
    socketService.on('admin_settings_data', onSettings);

    const handleRoomUpdate = (updatedRoom) => {
      if (Date.now() < suppressAutoJoinUntil) return;
      if (!updatedRoom) return;
      const inRoom = updatedRoom.players?.some(p => p.socketId === socketService.getSocketId());
      if (inRoom) {
        setCurrentRoom(updatedRoom);
        // переход в экран игры даже в статусе 'waiting', чтобы видеть стол
        setPage('game');
      }
    };

    const handleGameStarted = (room) => {
      if (Date.now() < suppressAutoJoinUntil) return;
      if (room?.players?.some(p => p.socketId === socketService.getSocketId())) {
        setCurrentRoom(room);
        setPage('game');
      }
    };

    socketService.on('room_update', handleRoomUpdate);
    socketService.on('game_started', handleGameStarted);
    const handleJoinedRoom = (room) => {
  setCurrentRoom(room);
  setPage('game');
  if (room && room.id) {
    saveLastTableId(room.id);
  }
};
socketService.on('joined_room', handleJoinedRoom);
    socketService.on('game_state_update', handleRoomUpdate);
    socketService.on('players_update', (players) => {
      setCurrentRoom((prev) => (prev ? { ...prev, players } : prev));
    });
    // Не редиректим здесь — модалка в GameScreen сама покажется
    socketService.on('game_over', () => {
  clearLastTableId();
});

    if (!token) {
      setAuthChecked(true);
    }

    socketService.connect();

    return () => {
      socketService.off('login_success', handleAuthSuccess);
      socketService.off('login_error', handleAuthError);
      socketService.off('login_success', onLoginSuccess);
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    socketService.requestInitState();
  }, [page]);

  const handleLogout = () => {
    setCurrentUser(null);
    setPage('lobby');
    socketService.disconnect();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('authToken');
    }
    socketService.connect();
  };

  const renderPage = () => {
    switch (page) {
      case 'lobby':
        return <LobbyScreen user={currentUser} onLogout={handleLogout} setPage={setPage} rooms={rooms} siteSettings={siteSettings} openAuthModal={() => setShowAuthModal(true)} />;
      case 'game':
        return <GameScreen setSuppressAutoJoinUntil={setSuppressAutoJoinUntil} room={currentRoom} setPage={setPage} />;
      case 'profile':
        return <ProfileScreen user={currentUser} setPage={setPage} />;
      case 'wallet':
        return <WalletScreen user={currentUser} setPage={setPage} />;
      case 'leaderboard':
        return <LeaderboardScreen setPage={setPage} leaderboard={leaderboard} />;
      case 'jackpotWheel':
        return <JackpotGame user={currentUser} />;
      case 'provably':
        return <ProvablyFair setPage={setPage} />;
      case 'admin':
        return <AdminPanel user={currentUser} setPage={setPage} siteSettings={siteSettings} />;
      default:
        return <LobbyScreen user={currentUser} onLogout={handleLogout} setPage={setPage} rooms={rooms} siteSettings={siteSettings} openAuthModal={() => setShowAuthModal(true)} />;
    }
  };

  // Live update of current user when admin changes balance/rank or after game results
  useEffect(() => {
    const handler = (updated) => {
      if (!updated) return;
      setCurrentUser(prev => prev ? { ...prev, ...updated } : updated);
    };
    socketService.on('current_user_update', handler);
    return () => socketService.off('current_user_update', handler);
  }, []);

  if (!authChecked) {
    return null;
  }

  return (
    <ErrorBoundary>
      <motion.div
        className="bg-bg text-text min-h-screen relative transition-colors duration-300 overflow-hidden"
        animate={{
          backgroundColor: theme === 'dark' ? '#050510' : '#f8fafc',
          color: theme === 'dark' ? '#f3f4ff' : '#0f172a',
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="parallax-bg" />
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
        <button
          className="fixed bottom-4 right-4 px-3 py-2 rounded bg-primary text-text shadow-md"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </motion.div>
    </ErrorBoundary>
  );
}

