// client/src/services/socketService.js
import io from 'socket.io-client';

const DEFAULT_SERVER_URL = 'http://185.233.47.116:4000';
const IS_DEV =
  import.meta.env?.DEV ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');

class SocketService {
  socket;
  serverUrl = import.meta.env?.VITE_SERVER_URL || DEFAULT_SERVER_URL;
  eventQueue = [];
  maxEventAge = 30000;
  handlers = new Map();

  connect() {
    if (this.socket?.connected || this.socket?.connecting) return;

    if (this.socket) {
      for (const [event, callbacks] of this.handlers) {
        for (const cb of callbacks) {
          this.socket.off(event, cb);
        }
      }
      this.socket.disconnect();
    }

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
      const now = Date.now();
      for (const { event, args, ts } of this.eventQueue) {
        if (now - ts <= this.maxEventAge) {
          this.socket.emit(event, ...args);
        }
      }
      this.eventQueue = [];
      this.socket.emit('request_init_state');
    });

    const onConnError = () => {
      this.eventQueue = [];
      console.error('Проблемы с подключением к серверу. Очередь событий очищена.');
      const handlers = this.handlers.get('connection_error');
      if (handlers) {
        for (const cb of handlers) cb();
      }
    };
    this.socket.on('connect_error', onConnError);
    this.socket.io.on('reconnect_failed', onConnError);
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
      const now = Date.now();
      this.eventQueue = this.eventQueue.filter((e) => now - e.ts <= this.maxEventAge);
      this.eventQueue.push({ event, args, ts: now });
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
    const callback = (res) => {
      if (!res?.ok) {
        console.error(res?.error || 'Ошибка ставки');
        const handlers = this.handlers.get('bet_error');
        if (handlers) {
          for (const h of handlers) h(res);
        }
      }
      cb && cb(res);
    };
    if (this.socket && this.socket.connected) {
      this.socket.emit('bet:place', payload, callback);
    } else {
      const now = Date.now();
      this.eventQueue = this.eventQueue.filter((e) => now - e.ts <= this.maxEventAge);
      this.eventQueue.push({ event: 'bet:place', args: [payload, callback], ts: now });
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
