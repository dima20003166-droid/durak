// client/src/App.js (auto-join flow, waiting-room navigation, toasts via alert)
import React, { useState, useEffect } from 'react';
import socketService from './services/socketService';
import AuthScreen from './pages/AuthScreen';
import LobbyScreen from './pages/LobbyScreen';
import GameScreen from './pages/GameScreen';
import ProfileScreen from './pages/ProfileScreen';
import WalletScreen from './pages/WalletScreen';
import LeaderboardScreen from './pages/LeaderboardScreen';
import AdminPanel from './pages/AdminPanel';
import './index.css';

function App() {
  const [page, setPage] = useState('auth');
  const [currentUser, setCurrentUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [suppressAutoJoinUntil, setSuppressAutoJoinUntil] = useState(0);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [siteSettings, setSiteSettings] = useState({ commission: 5, botsEnabled: true });

  useEffect(() => {
    socketService.connect();

    socketService.on('login_success', (user) => { setCurrentUser(user); setPage('lobby'); });
    socketService.on('user_data_updated', (user) => setCurrentUser(prev => ({...prev, ...user})));
    socketService.on('update_rooms', (serverRooms) => setRooms(serverRooms));
    socketService.on('leaderboard_data', (users) => setLeaderboard(users));
    socketService.on('admin_settings_data', (settings) => setSiteSettings(settings));

    // Прилетает всегда при входе в любой стол
    const handleJoined = (room) => {
      setCurrentRoom(room);
      setPage('game'); // переходим в экран стола даже в статусе waiting
    };

    // Любое обновление комнаты — если это наша, держим её в состоянии
    const handleRoomUpdate = (updatedRoom) => {
      if (!updatedRoom?.players) return;
      const meId = socketService.getSocketId();
      if (updatedRoom.players.some(p => p.socketId === meId)) {
        setCurrentRoom(updatedRoom);
        const now = Date.now();
        const suppressed = (page === 'lobby') && (now < suppressAutoJoinUntil);
        if (page !== 'game' && !suppressed) setPage('game');
      }
    };

    // Игра стартовала
    const handleGameStarted = (room) => {
      const meId = socketService.getSocketId();
      if (room.players.some(p => p.socketId === meId)) {
        setCurrentRoom(room);
        const now = Date.now();
        const suppressed = (page === 'lobby') && (now < suppressAutoJoinUntil);
        if (!suppressed) setPage('game');
        try { if (page === 'lobby' && !suppressed) alert('Игра началась!'); } catch {}
      }
    };

    socketService.on('joined_room', handleJoined);
    socketService.on('room_update', handleRoomUpdate);
    socketService.on('game_started', handleGameStarted);
    socketService.on('join_error', (msg) => alert(msg || 'Не удалось присоединиться'));

    // При создании стола сервер пришлёт id — сразу заходим
    socketService.on('created_room', ({ roomId }) => {
      if (roomId) socketService.joinRoom(roomId);
    });

    return () => {
      socketService.off('joined_room', handleJoined);
      socketService.off('room_update', handleRoomUpdate);
      socketService.off('game_started', handleGameStarted);
      socketService.off('join_error');
    };
  }, [page]);

  const handleLogout = () => {
    setCurrentUser(null);
    setPage('auth');
    socketService.disconnect();
    socketService.connect();
  };

  const renderPage = () => {
    switch (page) {
      case 'lobby': return <LobbyScreen user={currentUser} onLogout={handleLogout} setPage={setPage} rooms={rooms} />;
      case 'game': return <GameScreen room={currentRoom} setPage={setPage} setSuppressAutoJoinUntil={setSuppressAutoJoinUntil} />;
      case 'profile': return <ProfileScreen user={currentUser} setPage={setPage} />;
      case 'wallet': return <WalletScreen user={currentUser} setPage={setPage} />;
      case 'leaderboard': return <LeaderboardScreen setPage={setPage} leaderboard={leaderboard} />;
      case 'admin': return <AdminPanel user={currentUser} setPage={setPage} siteSettings={siteSettings} />;
      default: return <AuthScreen />;
    }
  };

  return <div className="bg-gray-900 min-h-screen">{renderPage()}</div>;
}

export default App;
