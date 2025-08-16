// client/src/services/socketService.js
import io from 'socket.io-client';

const DEFAULT_SERVER_URL = 'http://localhost:4000';
const IS_DEV =
  import.meta.env?.DEV ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');

class SocketService {
  socket;
  serverUrl = import.meta.env?.VITE_SERVER_URL || DEFAULT_SERVER_URL;
  eventQueue = [];
  handlers = new Map();

  connect() {
    if (!this.socket || !this.socket.connected) {
      this.socket = io(this.serverUrl);
      if (IS_DEV) {
        console.log('Connecting to server...');
      }

      // re-register stored handlers
      for (const [event, callbacks] of this.handlers) {
        for (const cb of callbacks) {
          this.socket.on(event, cb);
        }
      }

      // flush queued events once connected
      this.socket.on('connect', () => {
      for (const { event, args } of this.eventQueue) {
        this.socket.emit(event, ...args);
      }
      this.eventQueue = [];
      this.socket.emit('request_init_state');
    });
  }
}

  getServerUrl() {
    return this.serverUrl;
  }

  disconnect() {
    if (this.socket) this.socket.disconnect();
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  emit(event, ...args) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, ...args);
    } else {
      this.eventQueue.push({ event, args });
      if (this.eventQueue.length > 100) {
        this.eventQueue.shift();
        console.warn('Event queue overflow, oldest event dropped');
      }
      this.connect();
    }
  }

  login(credentials) { this.emit('login', credentials); }
  register(credentials) { this.emit('register', credentials); }
  guestLogin(name) { this.emit('guest_login', { name }); }
  createRoom(options) { this.emit('create_room', options); }
  joinRoom(roomId) { this.emit('join_room', { roomId }); }
  leaveRoom(roomId) { this.emit('leave_room', { roomId }); }
  playerAction(roomId, action, card) { this.emit('player_action', { roomId, action, card }); }
  sendGlobalMessage(message) { this.emit('send_global_message', message); }
  requestGlobalChat() { this.emit('request_global_chat'); }
  sendRoomMessage(roomId, text) { this.emit('send_room_message', { roomId, text }); }
  requestRoomChat(roomId) { this.emit('request_room_chat', { roomId }); }
  requestLeaderboard() { this.emit('request_leaderboard'); }
  requestUserStats(userId) { this.emit('request_user_stats', { userId }); }
  adminGetAllUsers() { this.emit('admin_get_all_users'); }
  adminUpdateUser(userId, data) { this.emit('admin_update_user', { userId, data }); }
  adminGetSettings() { this.emit('admin_get_settings'); }
  adminGetStats(range) { this.emit('admin_get_stats', { range }); }
  adminUpdateSettings(newSettings) { this.emit('admin_update_settings', newSettings); }
  updateAvatar(url) { this.emit('update_avatar', url); }
  updateAvatarFile(dataUrl) { this.emit('update_avatar_file', dataUrl); }
  cancelRoom(roomId) { this.emit('cancel_room', { roomId }); }

  requestInitState() { this.emit('request_init_state'); }

  // Jackpot wheel
  placeWheelBet(color, amount, clientBetId, cb) {
    const payload = { color, amount, clientBetId };
    if (this.socket && this.socket.connected) {
      this.socket.emit('bet:place', payload, cb);
    } else {
      this.eventQueue.push({ event: 'bet:place', args: [payload, cb] });
      if (this.eventQueue.length > 100) {
        this.eventQueue.shift();
        console.warn('Event queue overflow, oldest event dropped');
      }
      this.connect();
    }
  }

  // Moderation
  deleteChatMessage(messageId) { this.emit('chat:delete_message', { messageId }); }
  muteUser(userId, durationMinutes) { this.emit('chat:mute_user', { userId, durationMinutes }); }
  deleteAllUserMessages(userId) { this.emit('chat:delete_all_messages', { userId }); }

  on(event, cb) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event).add(cb);
    if (this.socket) this.socket.on(event, cb);
  }

  off(event, cb) {
    if (this.handlers.has(event)) {
      const set = this.handlers.get(event);
      set.delete(cb);
      if (set.size === 0) this.handlers.delete(event);
    }
    if (this.socket) this.socket.off(event, cb);
  }
}

export default new SocketService();
