// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import socketService from './services/socketService';
import LobbyScreen from './pages/LobbyScreen';
import GameScreen from './pages/GameScreen';
import ProfileScreen from './pages/ProfileScreen';
import WalletScreen from './pages/WalletScreen';
import LeaderboardScreen from './pages/LeaderboardScreen';
import AdminPanel from './pages/AdminPanel';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { Button, Box } from '@chakra-ui/react';
import { setTheme } from './theme';

export default function App() {
  const [page, setPage] = useState('lobby');
  const [suppressAutoJoinUntil, setSuppressAutoJoinUntil] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [siteSettings, setSiteSettings] = useState({ commission: 5, botsEnabled: true, maxPlayersLimit: 6 });
  const [theme, setThemeState] = useState('dark');

  useEffect(() => { setTheme(theme); }, [theme]);
  const toggleTheme = () => setThemeState(t => t === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    socketService.connect();

    const onLoginSuccess = (user) => { setCurrentUser(user); setPage('lobby'); };
    const onUserUpdated = (user) => setCurrentUser((prev) => ({ ...prev, ...user }));
    const onRooms = (serverRooms) => setRooms(serverRooms || []);
    const onLeaderboard = (users) => setLeaderboard(Array.isArray(users) ? users : []);
    const onSettings = (settings) => setSiteSettings(settings || { commission: 5, botsEnabled: true, maxPlayersLimit: 6 });

    socketService.on('login_success', onLoginSuccess);

  socketService.on('created_room', ({ roomId }) => { socketService.joinRoom(roomId); });    socketService.on('user_data_updated', onUserUpdated);
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
        socketService.on('joined_room', (room) => { setCurrentRoom(room); setPage('game'); });
    socketService.on('game_state_update', handleRoomUpdate);
// Не редиректим здесь — модалка в GameScreen сама покажется
socketService.on('game_over', () => {});
return () => { socketService.disconnect(); };

  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setPage('lobby');
    socketService.disconnect();
    socketService.connect();
  };

  const renderPage = () => {
    switch (page) {
      case 'lobby': return <LobbyScreen user={currentUser} onLogout={handleLogout} setPage={setPage} rooms={rooms} siteSettings={siteSettings} />;
      case 'game': return <GameScreen setSuppressAutoJoinUntil={setSuppressAutoJoinUntil} room={currentRoom} setPage={setPage} />;
      case 'profile': return <ProfileScreen user={currentUser} setPage={setPage} />;
      case 'wallet': return <WalletScreen user={currentUser} setPage={setPage} />;
      case 'leaderboard': return <LeaderboardScreen setPage={setPage} leaderboard={leaderboard} />;
      case 'admin': return <AdminPanel user={currentUser} setPage={setPage} siteSettings={siteSettings} />;
      default: return <LobbyScreen user={currentUser} onLogout={handleLogout} setPage={setPage} rooms={rooms} siteSettings={siteSettings} />;
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

  return (
    <ErrorBoundary>
      <Box className="bg-bg text-text min-h-screen relative">
        {renderPage()}
        <Button
          position="fixed"
          bottom={4}
          right={4}
          colorScheme="teal"
          onClick={toggleTheme}
          shadow="md"
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </Button>
      </Box>
    </ErrorBoundary>
  );
}
