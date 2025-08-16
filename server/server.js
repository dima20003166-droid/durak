const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');

let serviceAccount = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    const credPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, 'serviceAccountKey.json');
    serviceAccount = require(credPath);
  }
} catch (e) {
  console.error('Не удалось загрузить учётные данные Firebase:', e.message);
}

if (!serviceAccount) {
  console.error('Отсутствуют учётные данные Firebase. Установите FIREBASE_SERVICE_ACCOUNT.');
  process.exit(1);
}

const {
  createInitialGameState,
  handlePlayerAction,
  getBotMove,
  handleTimeout,
} = require('./gameLogic');
const { saveAvatarFromDataUrl } = require('./avatarService');
const JackpotWheel = require('./jackpotWheel');

// ---------------------- Firebase ----------------------
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
console.log('Успешное подключение к Firebase Firestore!');

// ---------------------- Настройки сайта ----------------------
let siteSettings = {
  commission: 5,
  botsEnabled: true,
  maxPlayersLimit: 6,
  rake: 0.05,
  roundDurationMs: 30000,
  lockMs: 2500,
  minBet: 1,
  maxBet: 1000,
};

async function loadSiteSettings() {
  try {
    const doc = await db.collection('settings').doc('site').get();
    if (doc.exists) {
      siteSettings = { ...siteSettings, ...(doc.data() || {}) };
      console.log('Настройки сайта загружены:', siteSettings);
    } else {
      await db.collection('settings').doc('site').set(siteSettings, { merge: true });
    }
  } catch (e) {
    console.error('Ошибка загрузки настроек:', e);
  }
}
loadSiteSettings();

async function saveSiteSettings(settings) {
  try {
    await db.collection('settings').doc('site').set(settings, { merge: true });
  } catch (e) {
    console.error('Ошибка сохранения настроек:', e);
  }
}

// ---------------------- HTTP + Socket.IO ----------------------
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] } });

let jackpotWheel;

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// --- Debug stats endpoint ---
app.get('/debug/stats', async (req, res) => {
  try {
    const range = (req.query && req.query.range) ? String(req.query.range) : '1d';
    const data = await computeAndBroadcastStats(range);
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e && e.message || e) });
  }
});

// ---------------------- Хранилища в памяти ----------------------
const BOT_NAMES = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
let gameRooms = {};
let globalChatCache = []; // Кэш для быстрой отправки, основное хранилище - Firestore
const mutedUsers = new Map(); // Map<userId, unmuteTimestamp>

// ---------------------- Утилиты ----------------------
const getRoomId = (payload) => (typeof payload === 'string' ? payload : payload?.roomId);
const safeUser = (user) => {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
};
const isPlayerInAnyRoom = (userId) => {
  return Object.values(gameRooms).some(room =>
    room.players.some(player => player.id === userId && !player.disconnected)
  );
};



// ---------------------- Онлайн-пользователи ----------------------
function getOnlineCount() {
  try {
    let count = 0;
    for (const [id, sock] of io.sockets.sockets) {
      if (sock?.data?.user?.id) count++;
    }
    return count;
  } catch { return 0; }
}
function broadcastOnlineCount() {
  try { io.emit('online_count', { count: getOnlineCount(), ts: Date.now() }); } catch {}
}

function emitToUser(userId, event, payload) {
  try {
    for (const [id, sock] of io.sockets.sockets) {
      if (sock?.data?.user?.id === userId) {
        try { sock.emit(event, payload); } catch {}
      }
    }
  } catch {}
}

async function initJackpotWheel() {
  let initial = null;
  try {
    const snap = await db.collection('jackpotRounds').orderBy('roundId', 'desc').limit(1).get();
    if (!snap.empty) {
      const data = snap.docs[0].data();
      if (!data.winnerColor) initial = data;
    }
  } catch (e) {
    console.error('Ошибка загрузки последнего раунда', e);
  }
  jackpotWheel = new JackpotWheel(io, db, emitToUser, {
    ROUND_DURATION_MS: siteSettings.roundDurationMs,
    LOCK_MS: siteSettings.lockMs,
    RAKE: siteSettings.rake,
    MIN_BET: siteSettings.minBet,
    MAX_BET: siteSettings.maxBet,
  }, initial);
}
initJackpotWheel();
// ---------------------- Admin Stats Helper ----------------------
async function computeAndBroadcastStats(range = '1d') {
  try {
    const now = new Date();
    let since = new Date(now);
    if (range === '7d') since.setDate(now.getDate() - 7);
    else if (range === '30d' || range === 'month') since.setDate(now.getDate() - 30);
    else since.setDate(now.getDate() - 1);

    const matchesSnap = await db.collection('matches')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(since))
      .get();

    let matchesCount = 0;
    let totalRevenue = 0;
    let botNet = 0;
    const earningsByDay = {};
    const commissionPct = Number((siteSettings && siteSettings.commission) || 0) / 100;

    matchesSnap.forEach(doc => {
      const d = doc.data() || {};
      matchesCount++;

      const bet = Number(d.bet || 0);
      const humanCount = Number(d.humanCount || 0);
      const loserIsHuman = !d.botLoser; // true если проигравший НЕ бот

      // Если в матче были боты — комиссия от ставки; иначе из призового фонда
      const isBotGame = !!d.hasBots || d.botsWonCount != null || d.botLoser != null;
      let houseCut = 0;
      if (isBotGame) {
        houseCut = bet * commissionPct;
      } else {
        const totalPrize = bet * Math.max(0, (humanCount - (loserIsHuman ? 1 : 0)));
        houseCut = totalPrize * commissionPct;
      }

      totalRevenue += houseCut;
      if (d.botDeltaNet != null) botNet += Number(d.botDeltaNet || 0);
      else if (d.botDelta != null) botNet += Number(d.botDelta || 0);

      const dayKey = d.createdAt && d.createdAt.toDate
        ? d.createdAt.toDate().toISOString().slice(0,10)
        : new Date().toISOString().slice(0,10);
      earningsByDay[dayKey] = (earningsByDay[dayKey] || 0) + houseCut;
    });

    const payload = {
      range,
      totalRevenue: Math.round((totalRevenue + Number.EPSILON) * 100) / 100,
      matchesCount,
      onlineCount: getOnlineCount(),
      botNet: Math.round((botNet + Number.EPSILON) * 100) / 100,
      earningsByDay: Object.fromEntries(
        Object.entries(earningsByDay).map(([k,v]) => [k, Math.round((v + Number.EPSILON)*100)/100])
      ),
    };

    // Пушим всем подключённым админам
    try {
      for (const [id, sock] of io.sockets.sockets) {
        if (sock?.data?.user?.role === 'admin') {
          sock.emit('admin_stats', payload);
        }
      }
    } catch {}

    return payload;
  } catch (e) {
    console.error('computeAndBroadcastStats error', e);
    return { range, totalRevenue: 0, matchesCount: 0, onlineCount: getOnlineCount(), botNet: 0, earningsByDay: {} };
  }
}


// ---------------------- Логика Ботов ----------------------
function fillWithBots(room) {
  if (!room || room.status !== 'waiting' || !siteSettings.botsEnabled) return;
  const botsNeeded = room.maxPlayers - room.players.length;
  if (botsNeeded <= 0) return;

  for (let i = 0; i < botsNeeded; i++) {
    const botName = BOT_NAMES[i % BOT_NAMES.length];
    room.players.push({
      socketId: `bot_${botName}_${i}_${Date.now()}`,
      username: `Bot ${botName}`, isBot: true, id: `bot_${i}_${room.id}`,
    });
  }
  // Перед запуском проверяем баланс всех людей
  const lacking = room.players.filter(p => !p.isBot && Number(p.balance || 0) < Number(room.bet || 0));
  if (lacking.length > 0) {
    lacking.forEach(p => { try { io.to(p.socketId).emit('join_error', `Недостаточно средств. Нужно ≥ ${room.bet}.`); } catch {} });
    return;
  }
  room.status = 'playing';
  room.gameState = createInitialGameState(room.players, room.mode);
  io.to(room.id).emit('game_started', room);
  io.emit('update_rooms', Object.values(gameRooms));
}

// ---------------------- Выплата и завершение ----------------------
async function performSettlementAndCleanup(room) {
  if (!room || room.status !== 'finished') return;
  const roomId = room.id;
  const loser = room.gameState?.loser;
  const winnersAll = room.players.filter((p) => !loser || p.socketId !== loser.socketId);
  const winnersHumans = winnersAll.filter((p) => !p.isBot);
  const humanCount = room.players.filter((p) => !p.isBot).length;
  const losersCount = (loser && !loser.isBot) ? 1 : 0;
  const totalPrize = (room.bet || 0) * Math.max(0, (humanCount - losersCount));
  const houseCut = totalPrize * ((siteSettings.commission || 0) / 100);
  const distributable = Math.max(0, Math.floor(totalPrize - houseCut));
  const prizeEach = winnersHumans.length ? Math.floor(distributable / winnersHumans.length) : 0;

  
  const isBotGame = (room.players||[]).some(p => p.isBot);
  const houseCutForStats = isBotGame
    ? (Number(room.bet||0) * ((Number(siteSettings.commission||0))/100))
    : (houseCut);
let message;
  if (winnersAll.length === 0) message = 'Игра окончена! Ничья!';
  else if (winnersAll.length === 1) message = `Игра окончена! Победитель: ${winnersAll[0].username}.` + (prizeEach > 0 ? ` Приз: ${prizeEach} ₽.` : '') + (loser ? ` Проигравший: ${loser.username}.` : '');
  else message = `Игра окончена! Победители: ${winnersAll.map(w => w.username).join(', ')}.` + (prizeEach > 0 ? ` Приз: ${prizeEach} ₽ каждому.` : '') + (loser ? ` Проигравший: ${loser.username}.` : '');

  const batch = db.batch();
  if (loser && !loser.isBot && loser.id) {
    let snap = null;
    try { snap = await db.collection('users').doc(loser.id).get(); } catch {}
    batch.update(db.collection('users').doc(loser.id), {
      'stats.losses': admin.firestore.FieldValue.increment(1),
      'stats.games': admin.firestore.FieldValue.increment(1),
      balance: admin.firestore.FieldValue.increment(-Math.min(Number((snap && snap.data && snap.data().balance) ? snap.data().balance : 0), Number(room.bet || 0)))
    });
  }
  winnersHumans.forEach((w) => {
    if (w.id) batch.update(db.collection('users').doc(w.id), {
      'stats.wins': admin.firestore.FieldValue.increment(1),
      'stats.games': admin.firestore.FieldValue.increment(1),
      balance: admin.firestore.FieldValue.increment(prizeEach)
    })
  });
  try { await batch.commit(); } catch (e) { console.error('Ошибка начисления наград:', e); }

  for (const p of room.players) {
    if (!p.isBot && p.id) {
      try {
        const snap = await db.collection('users').doc(p.id).get();
        if (snap.exists) io.to(p.socketId).emit('user_data_updated', safeUser({ id: p.id, ...snap.data() }));
      } catch {}
    }
  }

   // Готовим расширенное уведомление об окончании игры
  const payload = {
    message,                                     // уже сформированный текст
    winners: winnersAll.map(w => ({
      id: w.id || null,
      name: w.username || w.name || 'Игрок'
    })),
    loser: loser ? {
      id: loser.id || null,
      name: loser.username || loser.name || 'Игрок'
    } : null,
    prizeEach,                                   // сколько получил каждый победитель
    bet: room.bet || 0,
    commissionPercent: siteSettings.commission || 0
  };

  
  // --- Сохраняем результаты игры и комиссию ---
  try {
    const winnersIds = winnersAll.map(w => w.id).filter(Boolean);
    const loserId = loser?.id || null;
    const finishedAt = admin.firestore.Timestamp.fromDate(new Date());
    // Сохраняем комиссию сайта
    await db.collection('earnings').add({
      amount: Math.round(((houseCut || 0) + Number.EPSILON) * 100) / 100,
      bet: Number(room.bet || 0),
      roomId,
      winners: winnersIds,
      loser: loserId,
      createdAt: finishedAt
    });
    // Сохраняем матч (упрощённо)
    
    // Подсчёт виртуального баланса ботов за матч
    const botWinners = winnersAll.filter(w => w.isBot);
    const botsWonCount = botWinners.length;
    const botLoser = (loser && loser.isBot) ? loser : null;
    let botDeltaGross = 0;
    let botDeltaNet = 0;
    if (loser && !loser.isBot) {
      botDeltaGross = Number(room.bet || 0);
      botDeltaNet = botDeltaGross - Number(houseCutForStats || 0);
    } else if (botLoser) {
      botDeltaGross = -Number(room.bet || 0);
      botDeltaNet = botDeltaGross;
    }

    await db.collection('matches').add({
      roomId,
      hasBots: (room.players||[]).some(p=>p.isBot),
      botsWonCount,
      botLoser: !!botLoser,
      botDeltaGross,
      botDeltaNet,
      bet: Number(room.bet || 0),
      winners: winnersIds,
      loser: loserId,
      humanCount,
      createdAt: finishedAt
    });
    try { io.emit('admin_stats_dirty'); } catch {}
    try { setTimeout(() => computeAndBroadcastStats('1d'), 800); } catch {}
  } catch (e) { console.warn('save earnings/match', e?.message || e); }
io.to(roomId).emit('game_over', payload);
  try {
    for (const p of room.players) {
      if (p?.socketId) io.to(p.socketId).emit('game_over', { ...payload, roomId });
    }
  } catch {}

  try { room.status = 'finished'; io.to(roomId).emit('room_update', room); } catch {}

setTimeout(async () => {
  try { await db.collection('room_chats').doc(roomId).delete(); } catch (e) { console.warn('room chat cleanup', e?.message||e); }
  try { io.socketsLeave(roomId); } catch {}
  delete gameRooms[roomId];
  io.emit('update_rooms', Object.values(gameRooms));
}, 15000);


}

// ---------------------- Игровой цикл ----------------------
setInterval(async () => {
  const now = Date.now();
  for (const room of Object.values(gameRooms)) {
    if (room.status !== 'playing' || !room.gameState) continue;
    const state = room.gameState;
    // FALLBACK_TIMER_GUARD: если на столе есть неотбитая карта и таймер не выставлен — выставим сейчас
    try {
      if (state && Array.isArray(state.table) && state.table.some(p => !p.defense)) {
        if (!state.turnEndsAt || typeof state.turnEndsAt !== 'number') {
          state.turnEndsAt = Date.now() + 30000;
        }
      }
    } catch {}

    // HARD_FINISH_DETECTION: при пустой колоде и одном игроке с картами — конец игры
    try {
      if (state && Array.isArray(state.deck) && state.deck.length === 0) {
        const withCards = room.players.filter(p => Array.isArray(p.hand) && p.hand.length > 0);
        if (withCards.length <= 1) {
          state.loser = withCards[0] || null;
          room.status = 'finished';
          await performSettlementAndCleanup(room);
          continue;
        }
      }
    } catch {}

    // SECONDARY_TIMEOUT_CHECK: если время вышло — завершаем раунд безопасно
    try {
      if (state && state.turnEndsAt && now >= state.turnEndsAt) {
        handleTimeout(room);
        if (room.status === 'finished') { await performSettlementAndCleanup(room); }
        else { io.to(room.id).emit('game_state_update', room); }
        continue;
      }
    } catch {}

    // ----- оригинальная логика ниже -----
// AUTO FINISH CHECK: если колода пуста и 0-1 игроков с картами — завершаем автоматически
    try {
      if (state.deck && state.deck.length === 0) {
        const playersWithCards = room.players.filter(p => Array.isArray(p.hand) && p.hand.length > 0);
        if (playersWithCards.length <= 1) {
          room.status = 'finished';
          state.loser = playersWithCards[0] || null;
          await performSettlementAndCleanup(room);
          continue;
        }
      }
    } catch(e){ console.warn('auto-finish check error', e?.message||e); }

    if (state.turnEndsAt && now >= state.turnEndsAt) {
      handleTimeout(room);
      if (room.status === 'finished') {
        await performSettlementAndCleanup(room);
      } else {
        io.to(room.id).emit('game_state_update', room);
      }
      continue;
    }

    room.__botDelayUntil = room.__botDelayUntil || 0;
    if (now < room.__botDelayUntil) continue;

    const attacker = room.players[state.attackerIndex];
    const defender = room.players[state.defenderIndex];
    const delay = (ms) => room.__botDelayUntil = Date.now() + ms;

    if (attacker?.isBot) {
      const move = getBotMove(attacker, state, room.players);
      if (move) {
        handlePlayerAction(room, attacker.socketId, move.action, move.card);
        io.to(room.id).emit('game_state_update', room);
        if (room.status === 'finished') { await performSettlementAndCleanup(room); continue; }
        delay(move.action === 'attack' ? 900 : 1400);
      }
    } else if (defender?.isBot && state.table.some(p => !p.defense)) {
      const move = getBotMove(defender, state, room.players);
      if (move) {
        handlePlayerAction(room, defender.socketId, move.action, move.card);
        io.to(room.id).emit('game_state_update', room);
        if (room.status === 'finished') { await performSettlementAndCleanup(room); continue; }
        delay(move.action === 'defend' ? 800 : 1700);
      }
    }
  }
}, 500);

// ---------------------- Socket.IO Events ----------------------

const RATE_LIMITS = {
  'send_room_message': { tokens: 6, refill: 6, intervalMs: 3000 },
  'create_room':      { tokens: 2, refill: 1, intervalMs: 5000 },
  'room:create':      { tokens: 2, refill: 1, intervalMs: 5000 },
  'login':            { tokens: 5, refill: 5, intervalMs: 60000 },
  'register':         { tokens: 5, refill: 5, intervalMs: 60000 }
};

const socketBuckets = new WeakMap();
const ipBuckets = new Map();

function takeToken(key, event, store) {
  const now = Date.now();
  let bucket = store.get(key);
  if (!bucket) {
    bucket = { tokens: {}, ts: now };
    store.set(key, bucket);
  }
  const cfg = RATE_LIMITS[event];
  if (!cfg) return true;
  const elapsed = now - bucket.ts;
  const refills = Math.floor(elapsed / cfg.intervalMs);
  if (refills > 0) {
    bucket.ts = now;
    bucket.tokens[event] = Math.min((bucket.tokens[event] ?? cfg.tokens) + refills * cfg.refill, cfg.tokens);
  } else if (bucket.tokens[event] == null) {
    bucket.tokens[event] = cfg.tokens;
  }
  if (bucket.tokens[event] <= 0) return false;
  bucket.tokens[event] -= 1;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of ipBuckets.entries()) {
    if (now - bucket.ts > 60 * 60 * 1000) ipBuckets.delete(ip);
  }
}, 60 * 60 * 1000);

// Допустимый логин: 3–20 символов, буквы/цифры/подчёркивания
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

io.on('connection', (socket) => {
  socket.on('bet:place', async (payload, cb) => {
    try {
      const user = socket.data.user;
      if (!user) throw new Error('unauthorized');
      const { color, amount, clientBetId } = payload || {};
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) throw new Error('invalid_amount');
      if (amt > Number(user.balance || 0)) throw new Error('insufficient_funds');
      jackpotWheel.placeBet(
        user.id || socket.id,
        user.username || user.name || `Гость`,
        color,
        amt,
        clientBetId,
      );
      user.balance = Number(user.balance || 0) - amt;
      if (user.id) {
        try {
          await db
            .collection('users')
            .doc(user.id)
            .update({ balance: admin.firestore.FieldValue.increment(-amt) });
          await db.collection('jackpotLosses').add({
            userId: user.id,
            amount: amt,
            color,
            roundId: jackpotWheel.roundId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch {}
      }
      emitToUser(user.id, 'current_user_update', { balance: user.balance });
      cb && cb({ ok: true, balance: user.balance });
    } catch (e) {
      cb && cb({ ok: false, error: e.message });
    }
  });
  socket.on('force_recompute_stats', async (range) => { if (socket.data.user?.role!=='admin') return; await computeAndBroadcastStats(range||'1d'); });
  // Статистика: сумма заработка за периоды и кол-во игр
  socket.on('admin_get_stats', async (data) => {
    if (socket.data.user?.role !== 'admin') return;
    const range = (data && data.range) ? data.range : '1d';
    const payload = await computeAndBroadcastStats(range);
    socket.emit('admin_stats', payload);
  });

  const ip = socket.handshake.address;
  socket.data.ip = ip;

  function withRateLimit(event, handler, useIp = false) {
    return function (payload, cb) {
      const key = useIp ? ip : socket;
      const store = useIp ? ipBuckets : socketBuckets;
      if (!takeToken(key, event, store)) {
        if (cb) {
          return cb({ ok: false, code: 'ERR_RATE_LIMIT', msg: 'Слишком часто. Попробуйте чуть позже.' });
        }
        socket.emit(`${event}_error`, 'Слишком часто. Попробуйте чуть позже.');
        return;
      }
      return handler(payload, cb);
    };
  }

  console.log(`[+] Игрок подключился: ${socket.id} (${ip})`);
  setTimeout(broadcastOnlineCount, 0);
  try { socket.emit('update_rooms', Object.values(gameRooms)); } catch {}
  (async () => {
    try {
      if (!globalChatCache.length) {
        const chatSnap = await db.collection('chat').orderBy('timestamp', 'desc').limit(100).get();
        globalChatCache = chatSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })).reverse();
      }
      socket.emit('global_chat_history', globalChatCache);
    } catch (e) {
      console.error('init chat', e);
      socket.emit('global_chat_history', []);
    }
  })();

  socket.on('guest_login', ({ name }) => {
    const username = String(name || '').trim() || `Гость_${Math.floor(Math.random()*1000)}`;
    socket.data.user = { username, role: 'guest', balance: 0, socketId: socket.id, id: null };
    try { broadcastOnlineCount(); } catch {}
    socket.emit('login_success', safeUser(socket.data.user));
    socket.emit('update_rooms', Object.values(gameRooms));
    socket.emit('global_chat_history', globalChatCache);
  });

  socket.on('login', withRateLimit('login', async ({ username, password }) => {
    try {
      const usernameNorm = String(username || '').trim().toLowerCase();
      if (!USERNAME_REGEX.test(usernameNorm) || !password) {
        return socket.emit('login_error', 'Неверный логин или пароль');
      }
      const snap = await db.collection('users').where('usernameNorm', '==', usernameNorm).limit(1).get();
      if (snap.empty) return socket.emit('login_error', 'Пользователь не найден');
      let userDoc; snap.forEach(doc => userDoc = { id: doc.id, ...doc.data() });
      let valid = false;
      try { valid = await bcrypt.compare(password, userDoc.password); } catch {}
      if (!valid) return socket.emit('login_error', 'Неверный пароль');
      if (userDoc.isBanned) return socket.emit('login_error', 'Аккаунт заблокирован');

      socket.data.user = { ...userDoc, socketId: socket.id };
      try { broadcastOnlineCount(); } catch {}
      socket.emit('login_success', safeUser(socket.data.user));
      socket.emit('update_rooms', Object.values(gameRooms));

      const chatSnap = await db.collection('chat').orderBy('timestamp', 'desc').limit(100).get();
      const chatHistory = chatSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })).reverse();
      globalChatCache = chatHistory;
      socket.emit('global_chat_history', chatHistory);
    } catch (e) { console.error('Ошибка логина:', e); socket.emit('login_error', 'Ошибка сервера'); }
  }, true));

  socket.on('register', withRateLimit('register', async ({ username, password }) => {
    try {
      const rawName = String(username || '').trim();
      const usernameNorm = rawName.toLowerCase();
      if (!USERNAME_REGEX.test(usernameNorm)) {
        socket.emit('register_error', 'Недопустимый логин');
        return;
      }
      const snap = await db.collection('users').where('usernameNorm', '==', usernameNorm).limit(1).get();
      if (!snap.empty) {
        return socket.emit('register_error', 'Пользователь с таким именем уже существует.');
      }
      if (!password || password.length < 6 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        socket.emit('register_error', 'Пароль должен быть не короче 6 символов и содержать буквы и цифры');
        return;
      }
      const hashed = await bcrypt.hash(password, 10);
      const newUser = {
        username: rawName,
        usernameNorm,
        password: hashed,
        role: 'user',
        balance: 100, // Начальный баланс для новых игроков
        rating: 1000,
        stats: { games: 0, wins: 0, losses: 0 },
        isBanned: false,
        avatarUrl: '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection('users').add(newUser);
      socket.emit('register_success');
    } catch (e) {
      console.error('Ошибка регистрации:', e);
      socket.emit('register_error', 'Ошибка сервера при регистрации.');
    }
  }, true));

  socket.on('create_room', withRateLimit('create_room', (options) => {
  const user = socket.data.user;
  if (!user?.id) { socket.emit('join_error', 'Требуется авторизация'); return; }
  const userBalance = Number(user.balance || 0);
  if (userBalance <= 0) {
    return socket.emit('join_error', 'Недостаточно средств для создания стола.');
  }
  let requestedBet = Number(options?.bet) || 0;
  requestedBet = Math.max(1, requestedBet);
  if (requestedBet > userBalance) {
    return socket.emit('join_error', 'Ставка превышает ваш баланс.');
  }


  // Если уже в каком-то столе как игрок — нельзя
  if (isPlayerInAnyRoom(user.id)) {
    return socket.emit('join_error', 'Вы уже находитесь в игре.');
  }

  // Если уже есть созданный этим пользователем стол в ожидании — нельзя
  const hasWaitingCreatedRoom = Object.values(gameRooms).some(r =>
    r.creatorId === user.id && r.status === 'waiting'
  );
  if (hasWaitingCreatedRoom) {
    return socket.emit('join_error', 'У вас уже есть созданный стол в ожидании.');
  }

  const newRoomId = `room_${Date.now()}`;
  const room = {
    id: newRoomId,
    name: `${options?.mode || 'Подкидной'} стол от ${user.username}`,
    mode: options?.mode || 'Подкидной',
    bet: requestedBet,
    maxPlayers: (()=>{
    const limit = Math.min(6, Math.max(2, Number(siteSettings?.maxPlayersLimit||6)));
    const requested = Math.min(limit, Math.min(6, Math.max(2, Number(options?.players)||2)));
    return requested;
  })(),
    players: [],
    status: 'waiting',
    gameState: null,
    creatorId: user.id,
    createdAt: Date.now(),
  };

  gameRooms[newRoomId] = room;

  // Добавляем создателя в players и заводим в комнату
  room.players.push({ ...safeUser(user), socketId: socket.id });
  socket.join(newRoomId);

  socket.emit('created_room', { roomId: newRoomId });
  socket.emit('joined_room', room);
  io.to(newRoomId).emit('room_update', room);

  // Обновляем список столов всем
  io.emit('update_rooms', Object.values(gameRooms));
}));

    socket.on('join_room', async (payload) => {
      const roomId = getRoomId(payload);
      const room = gameRooms[roomId];
      const user = socket.data.user;
      if (!room) return socket.emit('join_error', 'Комната не найдена');
      if (!user?.id) return socket.emit('join_error', 'Требуется авторизация');

    const isAlreadyInAnotherRoom = Object.values(gameRooms).some(r => r.id !== roomId && r.players.some(p => p.id === user.id));
    if (isAlreadyInAnotherRoom) return socket.emit('join_error', 'Вы уже в другой игре.');
    // Балансная проверка до присоединения
    const userBalance = Number(user.balance || 0);
    if (room.status === 'waiting' && userBalance < Number(room.bet || 0)) {
      return socket.emit('join_error', `Недостаточно средств. Нужно ≥ ${room.bet}.`);
    }


    let player = room.players.find(p => p.id === user.id);
    if (player) {
      player.socketId = socket.id; delete player.disconnected;
    } else if (room.players.length < room.maxPlayers && room.status === 'waiting') {
      room.players.push({ ...safeUser(user), socketId: socket.id });
    } else return socket.emit('join_error', 'Стол занят');

    socket.join(roomId);
    socket.emit('joined_room', room);
    const roomChatDoc = await db.collection('room_chats').doc(roomId).get();
    if (roomChatDoc.exists) socket.emit('room_chat_history', roomChatDoc.data().messages || []);

    io.to(roomId).emit('room_update', room);
    io.to(roomId).emit('players_update', room.players);

    const humanPlayers = room.players.filter(p => !p.isBot).length;
    if (humanPlayers === room.maxPlayers && room.status === 'waiting') {
      const lacking = room.players.filter(p => !p.isBot && Number(p.balance || 0) < Number(room.bet || 0));
      if (lacking.length > 0) {
        lacking.forEach(p => { try { io.to(p.socketId).emit('join_error', `Недостаточно средств. Нужно ≥ ${room.bet}.`); } catch {} });
      } else {
        room.status = 'playing';
        room.gameState = createInitialGameState(room.players, room.mode);
        io.to(roomId).emit('game_started', room);
      }
    } else if (humanPlayers === 1 && room.maxPlayers > 1 && siteSettings.botsEnabled && room.status === 'waiting') {
      setTimeout(() => {
        const currentRoom = gameRooms[roomId];
        if (currentRoom && currentRoom.status === 'waiting' && currentRoom.players.filter(p => !p.isBot).length === 1) {
          fillWithBots(currentRoom);
        }
      }, 10000);
    }
    io.emit('update_rooms', Object.values(gameRooms));
  });

  socket.on('player_action', async ({ roomId, action, card }) => {
    const room = gameRooms[roomId];
    if (!room || !room.gameState) return;
    handlePlayerAction(room, socket.id, action, card);
    if (room.status === 'finished') await performSettlementAndCleanup(room);
    else io.to(roomId).emit('game_state_update', room);
  });

  // История общего чата за последние 24 часа по запросу
  socket.on('request_global_chat', async () => {
    try {
      const cutoffIso = new Date(Date.now() - 24*60*60*1000).toISOString();
      const snap = await db.collection('chat')
        .where('timestamp', '>=', cutoffIso)
        .orderBy('timestamp', 'asc')
        .get();
      const history = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      socket.emit('global_chat_history', history);
    } catch (e) {
      console.error('request_global_chat', e);
      socket.emit('global_chat_history', []);
    }
  });

  // История чата комнаты по запросу
  socket.on('request_room_chat', async ({ roomId }) => {
    try {
      if (!roomId) return socket.emit('room_chat_history', []);
      const doc = await db.collection('room_chats').doc(roomId).get();
      socket.emit('room_chat_history', (doc.exists && doc.data().messages) ? doc.data().messages : []);
    } catch (e) {
      console.error('request_room_chat', e);
      socket.emit('room_chat_history', []);
    }
  });

    socket.on('send_global_message', async (message) => {
      const user = socket.data.user;
      if (!user?.id) { socket.emit('chat_error', 'Требуется авторизация'); return; }
    if (mutedUsers.has(user.id) && mutedUsers.get(user.id) > Date.now()) {
      return socket.emit('chat_error', 'Вы временно не можете отправлять сообщения.');
    }
    const chatMessage = {
      user: safeUser(user), text: String(message || '').slice(0, 200),
      timestamp: new Date().toISOString(), createdAt: Date.now(),
    };
    if (!chatMessage.text.trim()) return;
    const docRef = await db.collection('chat').add(chatMessage);
    const finalMessage = { ...chatMessage, id: docRef.id };
    globalChatCache.push(finalMessage);
    if (globalChatCache.length > 100) globalChatCache.shift();
    io.emit('new_global_message', finalMessage);
  });
  
  // Модерация чата
  socket.on('chat:delete_message', async ({ messageId }) => {
    const user = socket.data.user;
    if (!user || !['admin', 'moderator'].includes(user.role)) return;
    try {
      await db.collection('chat').doc(messageId).delete();
      globalChatCache = globalChatCache.filter(m => m.id !== messageId);
      io.emit('deleted_global_message', { messageId });
    } catch (e) { console.error('chat:delete_message', e); }
  });
  
  socket.on('chat:mute_user', ({ userId, durationMinutes }) => {
    const user = socket.data.user;
    if (!user || !['admin', 'moderator'].includes(user.role)) return;
    const durationMs = (parseInt(durationMinutes, 10) || 5) * 60 * 1000;
    mutedUsers.set(userId, Date.now() + durationMs);
    emitToUser(userId, 'info_message', `Модератор временно ограничил вам возможность отправлять сообщения.`);
  });
  
  socket.on('chat:delete_all_messages', async ({ userId }) => {
    const user = socket.data.user;
    if (!user || !['admin', 'moderator'].includes(user.role)) return;
    try {
      const snap = await db.collection('chat').where('user.id', '==', userId).get();
      const batch = db.batch();
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      globalChatCache = globalChatCache.filter(m => m.user.id !== userId);
      io.emit('deleted_all_user_messages', { userId });
    } catch (e) { console.error('chat:delete_all_messages', e); }
  });

    socket.on('send_room_message', async ({ roomId, text }) => {
      const user = socket.data.user;
      if (!user?.id || !gameRooms[roomId]) return;
    const msg = { user: safeUser(user), text: String(text || '').slice(0, 200), timestamp: new Date().toISOString(), createdAt: Date.now() };
    if (!msg.text.trim()) return;
    const roomChatRef = db.collection('room_chats').doc(roomId);
    await roomChatRef.set({ messages: admin.firestore.FieldValue.arrayUnion(msg) }, { merge: true });
    io.to(roomId).emit('new_room_message', msg);
  });

  socket.on('cancel_room', (payload) => {
    const roomId = getRoomId(payload);
    const room = gameRooms[roomId];
    if (room && room.creatorId === socket.data.user?.id && room.status === 'waiting') {
      // Уведомляем всех в комнате, что она отменена
      io.to(roomId).emit('room_canceled', { message: 'Создатель отменил стол.' });
      
      // Выкидываем всех из сокет-комнаты
      const sockets = io.sockets.adapter.rooms.get(roomId);
      if (sockets) {
        sockets.forEach(socketId => {
          const socket = io.sockets.sockets.get(socketId);
          if (socket) socket.leave(roomId);
        });
      }

      delete gameRooms[roomId];
      io.emit('update_rooms', Object.values(gameRooms));
    }
  });

  socket.on('leave_room', (payload) => {
    const roomId = getRoomId(payload);
    if (!roomId) return;
    const room = gameRooms[roomId];
    const user = socket.data.user;
    if (!room || !user) return;

    // В активной игре выход = поражение
    if (room.status === 'playing') {
      const player = room.players.find(p => p.id === user.id);
      if (player) {
        room.gameState.loser = player;
        room.status = 'finished';
        performSettlementAndCleanup(room);
      }
    } else { // В лобби просто выходит
      room.players = room.players.filter(p => p.id !== user.id);
      socket.leave(roomId);

      if (room.players.length === 0) {
        io.socketsLeave(roomId);
        delete gameRooms[roomId];
        io.emit('update_rooms', Object.values(gameRooms));
      } else {
        io.to(roomId).emit('room_update', room);
        io.emit('update_rooms', Object.values(gameRooms));
        io.to(roomId).emit('players_update', room.players);
      }
    }
  });

  socket.on('disconnect', () => {
    setTimeout(broadcastOnlineCount, 0);
    console.log(`[-] Игрок отключился: ${socket.id}`);
    const user = socket.data.user;
    if (!user) return;
    Object.values(gameRooms).forEach(room => {
      const player = room.players.find(p => p.id === user.id);
      if (!player) return;
      if (room.status === 'playing') {
        player.disconnected = true;
        player.socketId = null; // Убираем ID сокета, чтобы нельзя было управлять
        io.to(room.id).emit('room_update', room);
        io.to(room.id).emit('players_update', room.players);
      } else {
        room.players = room.players.filter(p => p.id !== user.id);
        if (room.players.length === 0) delete gameRooms[room.id];
        else {
          io.to(room.id).emit('room_update', room);
          io.to(room.id).emit('players_update', room.players);
        }
      }
    });
    io.emit('update_rooms', Object.values(gameRooms));
  });

  // --- Админ-панель ---
  socket.on('admin_get_settings', () => socket.emit('admin_settings_data', siteSettings));
  socket.on('admin_update_settings', async (newSettings) => {
    if (socket.data.user?.role !== 'admin') return;
    siteSettings = { ...siteSettings, ...newSettings };
    await saveSiteSettings(siteSettings);
    jackpotWheel.config = {
      ...jackpotWheel.config,
      ROUND_DURATION_MS: siteSettings.roundDurationMs,
      LOCK_MS: siteSettings.lockMs,
      RAKE: siteSettings.rake,
      MIN_BET: siteSettings.minBet,
      MAX_BET: siteSettings.maxBet,
    };
    io.emit('admin_settings_data', siteSettings);
  });
socket.on('admin_get_all_users', async () => {
    if (socket.data.user?.role !== 'admin') return;
    try {
      const snap = await db.collection('users').orderBy('username').get();
      socket.emit('admin_user_list', snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error('admin_get_all_users', e); }
  });
  socket.on('admin_update_user', async ({ userId, data }) => {
    if (socket.data.user?.role !== 'admin') return;
    try {
      await db.collection('users').doc(userId).update(data || {});
      const updated = await db.collection('users').doc(userId).get();
      const updatedUser = { id: updated.id, ...(updated.data()||{}) };
      // Обновляем список пользователей для всех админов
      try {
        const snap = await db.collection('users').orderBy('username').get();
        io.emit('admin_user_list', snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch {}
      // Мгновенно отправляем обновление самому пользователю на всех его соединениях
      emitToUser(userId, 'current_user_update', safeUser(updatedUser));
      // Также подменим socket.data.user для этих соединений
      try {
        for (const [id, sock] of io.sockets.sockets) {
          if (sock?.data?.user?.id === userId) {
            sock.data.user = { ...(sock.data.user||{}), ...updatedUser };
          }
        }
      } catch {}
    } catch (e) { console.error('admin_update_user', e); }
  });

  // --- Вспомогательные запросы ---
  socket.on('request_leaderboard', async () => {
    try {
      const snap = await db.collection('users').orderBy('rating', 'desc').limit(50).get();
      socket.emit('leaderboard_data', snap.docs.map(doc => safeUser({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error('request_leaderboard', e); }
  });
  socket.on('request_user_stats', async ({ userId }) => {
    try {
      if (!userId) return;
      const snap = await db.collection('users').doc(userId).get();
      if (!snap.exists) return;
      socket.emit('user_stats', { userId, stats: snap.data().stats || { wins: 0, losses: 0, games: 0 } });
    } catch (e) { console.error('request_user_stats', e); }
  });

  // Обновление аватарки по URL
  socket.on('update_avatar', async (url) => {
    try {
      const user = socket.data.user;
      if (!user) return;
      const avatarUrl = String(url || '').trim();
      await db.collection('users').doc(user.id).update({ avatarUrl });
      socket.data.user.avatarUrl = avatarUrl;
      socket.emit('user_data_updated', { ...safeUser(socket.data.user) });
      io.emit('update_rooms', Object.values(gameRooms));
    } catch (e) { console.error('update_avatar', e); }
  });

  // Обновление аватарки из файла (dataURL base64)
  socket.on('update_avatar_file', async (dataUrl) => {
    try {
      const user = socket.data.user;
      if (!user) return;
      const publicUrl = await saveAvatarFromDataUrl(user.id, dataUrl);
      await db.collection('users').doc(user.id).update({ avatarUrl: publicUrl });
      socket.data.user.avatarUrl = publicUrl;
      socket.emit('user_data_updated', { ...safeUser(socket.data.user) });
      io.emit('update_rooms', Object.values(gameRooms));
    } catch (e) {
      const msg = e.message === 'FILE_TOO_LARGE' ? 'Файл слишком большой (макс 2MB).' : 'Ошибка загрузки аватара';
      socket.emit('avatar_error', msg);
      console.error('update_avatar_file', e);
    }
  });
});

// ---------------------- Запуск ----------------------
const PORT = 4000;
server.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));

// --- Auto cleanup of stale waiting rooms ---
function cleanupStaleRooms() {
  try {
    const now = Date.now();
    for (const [id, r] of Object.entries(gameRooms)) {
      if (r.status === 'waiting' && (!r.players || r.players.length === 0)) {
        const createdAt = r.createdAt || 0;
        if (now - createdAt > 10 * 60 * 1000) {
          delete gameRooms[id];
        }
      }
    }
    io.emit('update_rooms', Object.values(gameRooms));
  } catch (e) {
    console.error('cleanupStaleRooms error', e);
  }
}
setInterval(cleanupStaleRooms, 5 * 60 * 1000);