// client/src/pages/GameScreen.jsx (FULL, 2025‑08‑15)
// — В ОЖИДАНИИ: «Ожидаем игроков • ещё N» перенесено в центральный блок над «Стол создан / Ждём…»
// — Кнопка «Отменить ставку и выйти» показывается ТОЛЬКО обычному игроку (не создателю) и только для столов 3+
// — Кнопка «Сдаться» одна и справа, боевые кнопки по центру
import React, { useEffect, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import socketService from '../services/socketService';
import PlayersList from '../components/game/PlayersList';
import RoomChat from '../components/game/RoomChat';
import ProfileModal from '../components/game/ProfileModal';
import ActionPanel from '../components/game/ActionPanel';
import confetti from 'canvas-confetti';

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


const GameScreen = ({ room, setSuppressAutoJoinUntil, setPage }) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [surrenderOpen, setSurrenderOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false); // только для обычных игроков в ожидании 3+
  const [gameOverMessage, setGameOverMessage] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  const mySocketId = socketService.getSocketId();
  const myPlayer = room?.players?.find((p) => p.socketId === mySocketId);
  const confettiDisabled = localStorage.getItem('disableConfetti') === 'true';

  // чат комнаты
  const [chat, setChat] = useState([]);

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
      if (!confettiDisabled && data?.winnerId && data.winnerId === myPlayer?.id) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
    };
    socketService.on('game_over', onGameOver);
    return () => socketService.off('game_over', onGameOver);
  }, [myPlayer?.id, confettiDisabled]);
  useEffect(() => {
    const onUpdate = (r) => {
      if (r?.status === 'finished' && !gameOverMessage) setGameOverMessage('Игра окончена');
    };
    socketService.on('room_update', onUpdate);
    return () => socketService.off('room_update', onUpdate);
  }, [gameOverMessage]);

  if (!room && !gameOverMessage) {
    return (
        <div className="min-h-screen flex items-center justify-center text-text game-bg">
        Загрузка стола…
      </div>
    );
  }

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
  const sendRoomMessage = (text) => {
    const message = String(text || '');
    if (!message.trim()) return;
    socketService.sendRoomMessage(room.id, message);
  };

  const msLeft = Math.max(0, ((gameState?.turnEndsAt) || now) - now);
  const msToPercent = Math.min(100, Math.max(0, (msLeft / 30000) * 100));
  const msLeftSec = Math.ceil(msLeft / 1000);

  // ожидание игроков — нет gameState
  if (!gameState) {
    const need = Math.max(0, (Number(room?.maxPlayers || 2) - Number(room?.players?.length || 0)));
    const showCancelStake = Number(room?.maxPlayers || 2) >= 3 && !isOwner; // только обычным игрокам

    return (
      <div className="min-h-screen flex flex-col p-4 text-text game-bg">
        <style>{`@keyframes modalZoom{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}} .modal-zoom{animation:modalZoom .22s ease-out}`}</style>
        <header className="flex flex-wrap gap-2 justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-primary">{room.name}</h1>
          <div className="flex items-center gap-2">
            {showCancelStake && (
              <button
                onClick={() => setCancelOpen(true)}
                className="bg-surface text-text font-bold py-2 px-4 rounded-lg hover:bg-surface/80"
              >
                Отменить ставку и выйти
              </button>
            )}
            <button onClick={handleLeave} className="bg-danger hover:bg-danger/80 text-text font-bold py-2 px-4 rounded-lg transition-colors">
              Выйти в лобби
            </button>
          </div>
        </header>

        <div className="flex-grow grid grid-cols-3 gap-4">
          <div className="col-span-2 flex items-center justify-center">
            <div className="glass-surface p-8 rounded-xl text-center w-full max-w-lg">
              {/* перенесено сюда */}
              <div className="text-sm text-muted mb-2">Ожидаем игроков • ещё {need}</div>
              <p className="text-xl mb-2">Стол создан</p>
              <p className="text-muted">Ждём подключений игроков…</p>
            </div>
          </div>

            <RoomChat chat={chat} myPlayer={myPlayer} onSend={sendRoomMessage} openProfile={openProfile} isOpen />
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

  return (
    <div className="min-h-screen flex flex-col p-4 text-text overflow-hidden game-bg">
      <style>{`@keyframes modalZoom{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}} .modal-zoom{animation:modalZoom .22s ease-out}
      .custom-scroll::-webkit-scrollbar{width:6px;height:6px}.custom-scroll::-webkit-scrollbar-track{background:transparent}.custom-scroll::-webkit-scrollbar-thumb{background-color:rgba(255,255,255,.3);border-radius:3px}
      .custom-scroll{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.3) transparent}`}</style>

      {gameOverMessage && (
        <div className="fixed inset-0 bg-bg/80 flex items-center justify-center z-50">
          <div className="glass-surface p-8 rounded-lg text-center shadow-lg modal-zoom">
            <h2 className="text-3xl font-bold text-primary mb-4">Игра окончена!</h2>
            <p className="text-lg mb-6">{gameOverMessage}</p>
            <button
              onClick={() => { socketService.leaveRoom(room.id); setPage('lobby'); }}
              className="px-8 py-3 bg-primary rounded-lg font-semibold hover:bg-primary/80 transition-colors"
            >
              Вернуться в лобби
            </button>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-primary">{room.name}</h1>
        {room?.status === 'waiting' && (
          <div className="text-sm text-muted mt-1">
            Ожидаем игроков • ещё {Math.max(0, (Number(room?.maxPlayers || 2) - Number(room?.players?.length || 0)))}
          </div>
        )}
        <button onClick={handleLeave} className="bg-danger hover:bg-danger/80 text-text font-bold py-2 px-4 rounded-lg transition-colors">
          Покинуть
        </button>
      </header>

      <div className="grid grid-cols-3 gap-4 flex-1 h-0">
        <div className="col-span-2 flex flex-col">
          <div className="text-center p-2 bg-bg/50 rounded-lg">
            <p>{gameState.message}</p>
            <div className="mt-2 h-2 w-full bg-surface rounded">
              <div className="h-2 bg-primary rounded" style={{ width: `${msToPercent}%` }} />
            </div>
            <div className="text-xs text-muted mt-1">Ход: {msLeftSec} сек</div>
          </div>

            <PlayersList room={room} mySocketId={mySocketId} myPlayer={myPlayer} gameState={gameState} selectedCard={selectedCard} setSelectedCard={setSelectedCard} openProfile={openProfile} isOpen />
            <ActionPanel isAttacker={isAttacker} isDefender={isDefender} canThrowIn={canThrowIn} selectedCard={selectedCard} actionBusy={actionBusy} gameState={gameState} onAction={handleAction} onSurrender={() => setSurrenderOpen(true)} canSurrender={room?.status === "playing" && !actionBusy} />

        </div>

          <RoomChat chat={chat} myPlayer={myPlayer} onSend={sendRoomMessage} openProfile={openProfile} isOpen />
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
