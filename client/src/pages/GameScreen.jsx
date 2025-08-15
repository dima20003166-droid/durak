// client/src/pages/GameScreen.jsx (FULL, 2025‑08‑15)
// — В ОЖИДАНИИ: «Ожидаем игроков • ещё N» перенесено в центральный блок над «Стол создан / Ждём…»
// — Кнопка «Отменить ставку и выйти» показывается ТОЛЬКО обычному игроку (не создателю) и только для столов 3+
// — Кнопка «Сдаться» одна и справа, боевые кнопки по центру
import React, { useEffect, useRef, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import socketService from '../services/socketService';
import Card from '../components/Card';

function playWinDing() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 660;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.03);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    osc.stop(ctx.currentTime + 0.27);
    setTimeout(() => ctx.close(), 400);
  } catch (e) {}
}

const resolveAvatarUrl = (url, placeholder, base = null) => {
  const s = (url || '').toString().trim();
  if (!s) return placeholder;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const root = base || (typeof socketService?.getServerUrl === 'function' ? socketService.getServerUrl() : 'http://localhost:4000');
  return s.startsWith('/') ? (root + s) : s;
};

const ProfileModal = ({ user, onClose }) => {
  if (!user) return null;
  const stats = user.stats || { wins: 0, losses: 0 };
  const total = (stats.wins || 0) + (stats.losses || 0);
  const winRate = total ? Math.round((stats.wins / total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full max-w-md">
        <div className="flex items-center gap-4">
          <img
            className="w-16 h-16 rounded-full object-cover"
            src={resolveAvatarUrl(user.avatarUrl, `https://placehold.co/64x64/1f2937/ffffff?text=${user.username?.[0] || 'U'}`)}
            alt=""
          />
          <div>
            <div className="text-xl font-bold">{user.username}</div>
            <div className="text-gray-400">Рейтинг: {user.rating ?? '—'}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <div className="bg-gray-700 rounded p-2">
            <div className="text-xs text-gray-300">Игры</div>
            <div className="text-lg font-bold">{total}</div>
          </div>
          <div className="bg-gray-700 rounded p-2">
            <div className="text-xs text-gray-300">Победы</div>
            <div className="text-lg font-bold text-green-400">{stats.wins || 0}</div>
          </div>
          <div className="bg-gray-700 rounded p-2">
            <div className="text-xs text-gray-300">Пораж.</div>
            <div className="text-lg font-bold text-red-400">{stats.losses || 0}</div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-400 mt-2">Винрейт: {winRate}%</div>

        <div className="mt-6 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-emerald-600 rounded">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

const GameScreen = ({ room, setSuppressAutoJoinUntil, setPage }) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [surrenderOpen, setSurrenderOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false); // только для обычных игроков в ожидании 3+
  const [gameOverMessage, setGameOverMessage] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  // чат комнаты
  const [chat, setChat] = useState([]);
  const chatEndRef = useRef(null);
  const [msg, setMsg] = useState('');

  // модалка профиля
  const [profileOpen, setProfileOpen] = useState(null);

  const openProfile = (player) => {
    if (!player) return;
    setProfileOpen({
      ...player,
      stats: player.stats || { wins: 0, losses: 0 },
    });
    if (player.id) socketService.requestUserStats && socketService.requestUserStats(player.id);
  };

  useEffect(() => {
    const onUserStats = ({ userId, stats }) => {
      setProfileOpen((prev) => {
        if (!prev || prev.id !== userId) return prev;
        return { ...prev, stats: stats || { wins: 0, losses: 0 } };
      });
    };
    socketService.on('user_stats', onUserStats);
    return () => socketService.off('user_stats', onUserStats);
  }, []);

  // чат: история и новые
  useEffect(() => {
    const hist = (messages) => setChat(messages || []);
    const push = (m) => setChat((prev) => [...prev, m]);
    socketService.on('room_chat_history', hist);
    socketService.on('new_room_message', push);
    if (room?.id && socketService.requestRoomChat) socketService.requestRoomChat(room.id);
    return () => {
      socketService.off('room_chat_history', hist);
      socketService.off('new_room_message', push);
    };
  }, [room?.id]);

  useEffect(() => {
    try { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); } catch {}
  }, [chat]);

  // тикер и busy reset
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 300);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { setActionBusy(false); }, [room?.gameState]);

  // game over
  useEffect(() => {
    const onGameOver = (data) => {
      setGameOverMessage(data?.message || 'Игра окончена');
      playWinDing();
    };
    socketService.on('game_over', onGameOver);
    return () => socketService.off('game_over', onGameOver);
  }, []);
  useEffect(() => {
    const onUpdate = (r) => {
      if (r?.status === 'finished' && !gameOverMessage) setGameOverMessage('Игра окончена');
    };
    socketService.on('room_update', onUpdate);
    return () => socketService.off('room_update', onUpdate);
  }, [gameOverMessage]);

  if (!room && !gameOverMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">
        Загрузка стола…
      </div>
    );
  }

  const mySocketId = socketService.getSocketId();
  const myPlayer = room?.players?.find((p) => p.socketId === mySocketId);
  const gameState = room?.gameState;
  const isOwner = !!((room?.ownerId && myPlayer?.id && room.ownerId === myPlayer.id) ||
                     (room?.ownerSocketId && room.ownerSocketId === mySocketId));

  const isAttacker = !!gameState && room.players[gameState.attackerIndex]?.socketId === myPlayer?.socketId;
  const isDefender = !!gameState && room.players[gameState.defenderIndex]?.socketId === myPlayer?.socketId;
  const canThrowIn = !!gameState && !isDefender && gameState.table.length > 0;

  const handleAction = (action) => {
    if (!room?.id) return;
    if (actionBusy) return;
    setActionBusy(true);
    socketService.playerAction(room.id, action, selectedCard);
    if (action === 'attack' || action === 'defend') setSelectedCard(null);
    setTimeout(() => setActionBusy(false), 800);
  };
  const handleSurrender = () => { if (room?.id) socketService.playerAction(room.id, 'surrender'); };
  const handleLeave = () => {
    if (typeof setSuppressAutoJoinUntil === 'function') setSuppressAutoJoinUntil(Date.now() + 300000);
    setPage('lobby');
  };
  const sendRoomMessage = () => {
    const text = String(msg || '');
    if (!text.trim()) return;
    socketService.sendRoomMessage(room.id, text);
    setMsg('');
  };

  const msLeft = Math.max(0, ((gameState?.turnEndsAt) || now) - now);
  const msToPercent = Math.min(100, Math.max(0, (msLeft / 30000) * 100));
  const msLeftSec = Math.ceil(msLeft / 1000);

  // ожидание игроков — нет gameState
  if (!gameState) {
    const need = Math.max(0, (Number(room?.maxPlayers || 2) - Number(room?.players?.length || 0)));
    const showCancelStake = Number(room?.maxPlayers || 2) >= 3 && !isOwner; // только обычным игрокам

    return (
      <div className="min-h-screen flex flex-col p-4 bg-gray-900 text-white">
        <style>{`@keyframes modalZoom{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}} .modal-zoom{animation:modalZoom .22s ease-out}`}</style>
        <header className="flex flex-wrap gap-2 justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-emerald-400">{room.name}</h1>
          <div className="flex items-center gap-2">
            {showCancelStake && (
              <button
                onClick={() => setCancelOpen(true)}
                className="bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600"
              >
                Отменить ставку и выйти
              </button>
            )}
            <button onClick={handleLeave} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg">
              Выйти в лобби
            </button>
          </div>
        </header>

        <div className="flex-grow grid grid-cols-3 gap-4">
          <div className="col-span-2 flex items-center justify-center">
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center w-full max-w-lg">
              {/* перенесено сюда */}
              <div className="text-sm text-gray-300 mb-2">Ожидаем игроков • ещё {need}</div>
              <p className="text-xl mb-2">Стол создан</p>
              <p className="text-gray-300">Ждём подключений игроков…</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col">
            <div className="font-semibold mb-2">Чат стола</div>
            <div className="flex-1 overflow-y-auto custom-scroll space-y-2 max-h-64 md:max-h-80">
              {chat.map((m, i) => {
                const isMine = (m.user?.id && myPlayer?.id && m.user.id === myPlayer.id) || (m.user?.username === myPlayer?.username);
                return (
                  <div key={i} className={`flex items-start gap-2 ${isMine ? 'justify-end' : ''}`}>
                    {!isMine && (
                      <img
                        className="w-7 h-7 rounded-full object-cover cursor-pointer"
                        src={resolveAvatarUrl(m.user?.avatarUrl, `https://placehold.co/28x28/1f2937/ffffff?text=${m.user?.username?.[0] || 'U'}`)}
                        onClick={() => openProfile(m.user)}
                        alt=""
                      />
                    )}
                    <div className={`rounded-lg px-3 py-2 max-w-[240px] ${isMine ? 'bg-emerald-800' : 'bg-gray-700'}`}>
                      <div
                        className="text-xs text-gray-300 cursor-pointer"
                        onClick={() => openProfile(m.user)}
                        style={{ textAlign: isMine ? 'right' : 'left' }}
                      >
                        {m.user?.username || 'Игрок'}
                      </div>
                      <div className="text-sm" style={{ textAlign: isMine ? 'right' : 'left' }}>
                        {m.text}
                      </div>
                    </div>
                    {isMine && (
                      <img
                        className="w-7 h-7 rounded-full object-cover cursor-pointer"
                        src={resolveAvatarUrl(m.user?.avatarUrl, `https://placehold.co/28x28/1f2937/ffffff?text=${m.user?.username?.[0] || 'U'}`)}
                        onClick={() => openProfile(m.user)}
                        alt=""
                      />
                    )}
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <div className="flex mt-2">
              <input
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => (e.key === 'Enter' ? sendRoomMessage() : null)}
                className="flex-1 bg-gray-700 rounded-l px-2 py-1"
                placeholder="Сообщение..."
              />
              <button className="bg-emerald-600 rounded-r px-3" onClick={sendRoomMessage}>
                Отправить
              </button>
            </div>
          </div>
        </div>

        {/* модалка отмены ставки — только не создателю */}
        <ConfirmDialog
          open={cancelOpen}
          title="Отменить ставку?"
          message={"Стол рассчитан на 3+ игроков.\nОтменить ставку и выйти? Ваш прогресс в этой игре не будет сохранён."}
          confirmText="Отменить и выйти"
          cancelText="Назад"
          onConfirm={() => {
            setCancelOpen(false);
            try {
              socketService.leaveRoom(room.id);
            } finally {
              setPage('lobby');
            }
          }}
          onCancel={() => setCancelOpen(false)}
        />

        {profileOpen && <ProfileModal user={profileOpen} onClose={() => setProfileOpen(null)} />}
      </div>
    );
  }

  // основной экран игры
  const myIdx = room.players.findIndex((x) => x.socketId === mySocketId);

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gray-900 text-white overflow-hidden">
      <style>{`@keyframes modalZoom{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}} .modal-zoom{animation:modalZoom .22s ease-out}
      .custom-scroll::-webkit-scrollbar{width:6px;height:6px}.custom-scroll::-webkit-scrollbar-track{background:transparent}.custom-scroll::-webkit-scrollbar-thumb{background-color:rgba(255,255,255,.3);border-radius:3px}
      .custom-scroll{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.3) transparent}`}</style>

      {gameOverMessage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg text-center border border-emerald-500 shadow-lg modal-zoom">
            <h2 className="text-3xl font-bold text-emerald-400 mb-4">Игра окончена!</h2>
            <p className="text-lg mb-6">{gameOverMessage}</p>
            <button
              onClick={() => { socketService.leaveRoom(room.id); setPage('lobby'); }}
              className="px-8 py-3 bg-emerald-600 rounded-lg font-semibold hover:bg-emerald-700"
            >
              Вернуться в лобби
            </button>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-emerald-400">{room.name}</h1>
        {room?.status === 'waiting' && (
          <div className="text-sm text-gray-300 mt-1">
            Ожидаем игроков • ещё {Math.max(0, (Number(room?.maxPlayers || 2) - Number(room?.players?.length || 0)))}
          </div>
        )}
        <button onClick={handleLeave} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg">
          Покинуть
        </button>
      </header>

      <div className="grid grid-cols-3 gap-4 flex-1 h-0">
        <div className="col-span-2 flex flex-col">
          <div className="text-center p-2 bg-black/50 rounded-lg">
            <p>{gameState.message}</p>
            <div className="mt-2 h-2 w-full bg-gray-700 rounded">
              <div className="h-2 bg-emerald-500 rounded" style={{ width: `${msToPercent}%` }} />
            </div>
            <div className="text-xs text-gray-400 mt-1">Ход: {msLeftSec} сек</div>
          </div>

          <div className="relative flex-grow w-full h-full mt-2">
            {room.players.map((p, index) => {
              const relativeIndex = (index - myIdx + room.players.length) % room.players.length;

              const pos =
                relativeIndex === 0
                  ? { bottom: '4%', left: '50%', transform: 'translateX(-50%)' }
                  : (() => {
                      const angle = (relativeIndex / (room.players.length - 1)) * Math.PI;
                      const radiusX = 45, radiusY = 40;
                      const x = 50 - radiusX * Math.cos(angle);
                      const y = 40 - radiusY * Math.sin(angle);
                      return { top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)' };
                    })();

              const isCurrentAttacker = index === gameState.attackerIndex;
              const isCurrentDefender = index === gameState.defenderIndex;

              return (
                <div key={p.socketId} className="absolute transition-all duration-500" style={pos}>
                  <div className="relative flex flex-col items-center w-40">
                    <div
                      className={`absolute -top-6 px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${
                        isCurrentAttacker ? 'bg-red-600' : ''
                      } ${isCurrentDefender ? 'bg-blue-600' : ''}`}
                    >
                      {isCurrentAttacker ? 'Атака' : isCurrentDefender ? 'Защита' : ''}
                    </div>

                    <img
                      className="w-16 h-16 rounded-full object-cover cursor-pointer"
                      src={resolveAvatarUrl(p.avatarUrl, `https://placehold.co/64x64/1f2937/ffffff?text=${p.username.charAt(0)}`)}
                      onClick={() => openProfile(p)}
                      alt=""
                    />
                    <p className="font-semibold mt-1 truncate cursor-pointer" onClick={() => openProfile(p)}>
                      {p.username}
                    </p>

                    <div className="relative flex justify-center items-center h-28 w-full mt-2">
                      {p.socketId === mySocketId
                        ? myPlayer.hand.map((card, i) => (
                            <div
                              key={card.id}
                              className="absolute"
                              style={{ transform: `translateX(${(i - myPlayer.hand.length / 2) * 25}px)` }}
                            >
                              <Card
                                {...card}
                                isSelected={selectedCard?.id === card.id}
                                onClick={() => setSelectedCard(card)}
                              />
                            </div>
                          ))
                        : Array(p.hand.length)
                            .fill(0)
                            .map((_, i) => (
                              <div
                                key={i}
                                className="absolute"
                                style={{ transform: `translateX(${(i - p.hand.length / 2) * 10}px)` }}
                              >
                                <Card isFaceUp={false} />
                              </div>
                            ))}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-4">
              <div className="flex flex-col items-center w-24">
                <Card {...gameState.trumpCard} />
                <p className="mt-2">{gameState.deck.length} карт</p>
              </div>
              <div className="flex items-center justify-center gap-4 min-w-[300px]">
                {gameState.table.map((pair, i) => (
                  <div key={i} className="relative w-20 h-28">
                    <Card {...pair.attack} />
                    {pair.defense && <Card {...pair.defense} className="transform translate-x-2 translate-y-2" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* КНОПКИ: центр снизу; «Сдаться» — справа */}
          <div className="flex items-center gap-4 p-4">
            <div className="mx-auto flex items-center gap-4">
              {(isAttacker || canThrowIn) && (
                <button
                  onClick={() => handleAction('attack')}
                  disabled={!selectedCard || actionBusy}
                  className="px-6 py-3 font-semibold rounded-lg bg-emerald-600 disabled:bg-gray-600"
                >
                  Ходить/Подкинуть
                </button>
              )}
              {isDefender && (
                <button
                  onClick={() => handleAction('defend')}
                  disabled={!selectedCard || actionBusy || !gameState.table.some((p) => !p.defense)}
                  className="px-6 py-3 font-semibold rounded-lg bg-green-500 disabled:bg-gray-600"
                >
                  Отбиться
                </button>
              )}
              {(isAttacker || canThrowIn) && (
                <button
                  onClick={() => handleAction('pass')}
                  disabled={actionBusy || gameState.table.length === 0 || !gameState.table.every((p) => p.defense)}
                  className="px-6 py-3 font-semibold rounded-lg bg-yellow-600 disabled:bg-gray-600"
                >
                  Бито
                </button>
              )}
              {isDefender && (
                <button
                  onClick={() => handleAction('take')}
                  disabled={actionBusy || gameState.table.length === 0}
                  className="px-6 py-3 font-semibold rounded-lg bg-red-600 disabled:bg-gray-600"
                >
                  Беру
                </button>
              )}
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setSurrenderOpen(true)}
                disabled={actionBusy || room?.status !== 'playing'}
                className="px-6 py-3 font-semibold rounded-lg bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600"
                title="Признать поражение и завершить игру"
              >
                Сдаться
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col">
          <div className="font-semibold mb-2">Чат стола</div>
          <div className="flex-1 overflow-y-auto custom-scroll space-y-2 max-h-64 md:max-h-80">
            {chat.map((m, i) => {
              const isMine = (m.user?.id && myPlayer?.id && m.user.id === myPlayer.id) || (m.user?.username === myPlayer?.username);
              return (
                <div key={i} className={`flex items-start gap-2 ${isMine ? 'justify-end' : ''}`}>
                  {!isMine && (
                    <img
                      className="w-7 h-7 rounded-full object-cover cursor-pointer"
                      src={resolveAvatarUrl(m.user?.avatarUrl, `https://placehold.co/28x28/1f2937/ffffff?text=${m.user?.username?.[0] || 'U'}`)}
                      onClick={() => openProfile(m.user)}
                      alt=""
                    />
                  )}
                  <div className={`rounded-lg px-3 py-2 max-w-[240px] ${isMine ? 'bg-emerald-800' : 'bg-gray-700'}`}>
                    <div
                      className="text-xs text-gray-300 cursor-pointer"
                      onClick={() => openProfile(m.user)}
                      style={{ textAlign: isMine ? 'right' : 'left' }}
                    >
                      {m.user?.username || 'Игрок'}
                    </div>
                    <div className="text-sm" style={{ textAlign: isMine ? 'right' : 'left' }}>
                      {m.text}
                    </div>
                  </div>
                  {isMine && (
                    <img
                      className="w-7 h-7 rounded-full object-cover cursor-pointer"
                      src={resolveAvatarUrl(m.user?.avatarUrl, `https://placehold.co/28x28/1f2937/ffffff?text=${m.user?.username?.[0] || 'U'}`)}
                      onClick={() => openProfile(m.user)}
                      alt=""
                    />
                  )}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          <div className="flex mt-2">
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => (e.key === 'Enter' ? sendRoomMessage() : null)}
              className="flex-1 bg-gray-700 rounded-l px-2 py-1"
              placeholder="Сообщение..."
            />
            <button className="bg-emerald-600 rounded-r px-3" onClick={sendRoomMessage}>
              Отправить
            </button>
          </div>
        </div>
      </div>

      {/* Модалка сдачи */}
      <ConfirmDialog
        open={surrenderOpen}
        title="Сдаться?"
        message={"Вы уверены, что хотите признать поражение?\nПоражение будет засчитано в статистике."}
        confirmText="Сдаться"
        cancelText="Отмена"
        onConfirm={() => { setSurrenderOpen(false); handleSurrender(); }}
        onCancel={() => setSurrenderOpen(false)}
      />

      {profileOpen && <ProfileModal user={profileOpen} onClose={() => setProfileOpen(null)} />}
    </div>
  );
};

export default GameScreen;
