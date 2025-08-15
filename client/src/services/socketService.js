// client/src/services/socketService.js
import io from 'socket.io-client';
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000';

class SocketService {
  socket;

  connect() {
    if (!this.socket) {
      this.socket = io(SERVER_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
      });
      this.socket.on('connect_error', (err) => {
        console.error('Connection error:', err);
        alert('Ошибка подключения. Переподключение...');
      });
      this.socket.on('reconnect', (attempt) => {
        console.log(`Reconnected to server after ${attempt} attempts`);
        alert('Соединение восстановлено');
      });
      this.socket.on('reconnect_failed', () => {
        console.error('Failed to reconnect to server');
        alert('Не удалось восстановить соединение');
      });
      console.log('Connecting to server...');
    } else if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  getServerUrl() {
    return SERVER_URL;
  }

  disconnect() {
    if (this.socket) this.socket.disconnect();
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  login(credentials) { this.socket.emit('login', credentials); }
  register(credentials) { this.socket.emit('register', credentials); }
  createRoom(options) { this.socket.emit('create_room', options); }
  joinRoom(roomId) { this.socket.emit('join_room', { roomId }); }
  leaveRoom(roomId) { this.socket.emit('leave_room', { roomId }); }
  playerAction(roomId, action, card) { this.socket.emit('player_action', { roomId, action, card }); }
  sendGlobalMessage(message) { this.socket.emit('send_global_message', message); }
  requestGlobalChat() { this.socket.emit('request_global_chat'); }
  sendRoomMessage(roomId, text) { this.socket.emit('send_room_message', { roomId, text }); }
  requestRoomChat(roomId) { this.socket.emit('request_room_chat', { roomId }); }
  requestLeaderboard() { this.socket.emit('request_leaderboard'); }
  requestUserStats(userId) { this.socket.emit('request_user_stats', { userId }); }
  adminGetAllUsers() { this.socket.emit('admin_get_all_users'); }
  adminUpdateUser(userId, data) { this.socket.emit('admin_update_user', { userId, data }); }
  adminGetSettings() { this.socket.emit('admin_get_settings'); }
  adminGetStats(range) { this.socket.emit('admin_get_stats', { range }); }
  adminUpdateSettings(newSettings) { this.socket.emit('admin_update_settings', newSettings); }
  updateAvatar(url) { this.socket.emit('update_avatar', url); }
  updateAvatarFile(dataUrl) { this.socket.emit('update_avatar_file', dataUrl); }
  cancelRoom(roomId) { this.socket.emit('cancel_room', { roomId }); }
  
  // Moderation
  deleteChatMessage(messageId) { this.socket.emit('chat:delete_message', { messageId }); }
  muteUser(userId, durationMinutes) { this.socket.emit('chat:mute_user', { userId, durationMinutes }); }
  deleteAllUserMessages(userId) { this.socket.emit('chat:delete_all_messages', { userId }); }

  on(e, cb) { if (this.socket) this.socket.on(e, cb); }
  off(e, cb) { if (this.socket) this.socket.off(e, cb); }
}

  export default new SocketService();
