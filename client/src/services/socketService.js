// client/src/services/socketService.js
import io from 'socket.io-client';
const SERVER_URL = "http://localhost:4000";

class SocketService {
  socket;

  constructor() {
    this.connect();
  }

  connect() {
    if (!this.socket || !this.socket.connected) {
      this.socket = io(SERVER_URL);
    }
  }

  emit(event, ...args) {
    this.connect();
    this.socket.emit(event, ...args);
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

  login(credentials) {
    this.emit('login', credentials);
  }

  register(credentials) {
    this.emit('register', credentials);
  }

  createRoom(options) {
    this.emit('create_room', options);
  }

  joinRoom(roomId) {
    this.emit('join_room', { roomId });
  }

  leaveRoom(roomId) {
    this.emit('leave_room', { roomId });
  }

  playerAction(roomId, action, card) {
    this.emit('player_action', { roomId, action, card });
  }

  sendGlobalMessage(message) {
    this.emit('send_global_message', message);
  }

  requestGlobalChat() {
    this.emit('request_global_chat');
  }

  sendRoomMessage(roomId, text) {
    this.emit('send_room_message', { roomId, text });
  }

  requestRoomChat(roomId) {
    this.emit('request_room_chat', { roomId });
  }

  requestLeaderboard() {
    this.emit('request_leaderboard');
  }

  requestUserStats(userId) {
    this.emit('request_user_stats', { userId });
  }

  adminGetAllUsers() {
    this.emit('admin_get_all_users');
  }

  adminUpdateUser(userId, data) {
    this.emit('admin_update_user', { userId, data });
  }

  adminGetSettings() {
    this.emit('admin_get_settings');
  }

  adminGetStats(range) {
    this.emit('admin_get_stats', { range });
  }

  adminUpdateSettings(newSettings) {
    this.emit('admin_update_settings', newSettings);
  }

  updateAvatar(url) {
    this.emit('update_avatar', url);
  }

  updateAvatarFile(dataUrl) {
    this.emit('update_avatar_file', dataUrl);
  }

  cancelRoom(roomId) {
    this.emit('cancel_room', { roomId });
  }

  // Moderation
  deleteChatMessage(messageId) {
    this.emit('chat:delete_message', { messageId });
  }

  muteUser(userId, durationMinutes) {
    this.emit('chat:mute_user', { userId, durationMinutes });
  }

  deleteAllUserMessages(userId) {
    this.emit('chat:delete_all_messages', { userId });
  }

  on(e, cb) {
    this.connect();
    if (this.socket) this.socket.on(e, cb);
  }

  off(e, cb) {
    if (this.socket) this.socket.off(e, cb);
  }
}

export default new SocketService();
