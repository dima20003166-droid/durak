import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socketService from '../services/socketService';
import ConfirmDialog from '../components/ConfirmDialog';
import AdminBadge from '../components/AdminBadge';
import { RoomCardSkeleton, ChatMessageSkeleton } from '../components/Skeletons';
import UserIcon from '../components/icons/UserIcon';
import SettingsIcon from '../components/icons/SettingsIcon';
import LogoutIcon from '../components/icons/LogoutIcon';
import WalletIcon from '../components/icons/WalletIcon';
import TrophyIcon from '../components/icons/TrophyIcon';

// Вспомогательный компонент для меню модерации (теперь он внешний)
const ModerationMenu = ({ menuData, onAction, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef, onClose]);

    if (!menuData?.isOpen) {
        return null;
    }

    const { msg, position } = menuData;

    const handleAction = (action, value) => {
        onAction(action, msg.id, msg.user.id, value);
        onClose();
    };
    
    // Стили для позиционирования меню, чтобы оно не выходило за рамки экрана
    const style = {
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
    };

    return (
        <div ref={menuRef} style={style} className="w-48 bg-surface border border-border rounded-lg shadow-lg z-50">
            <button onClick={() => handleAction('delete')} className="block w-full text-left px-4 py-2 text-sm hover:bg-surface/80 rounded-t-lg">Удалить сообщение</button>
            <button onClick={() => handleAction('mute', 5)} className="block w-full text-left px-4 py-2 text-sm hover:bg-surface/80">Мут на 5 мин</button>
            <button onClick={() => handleAction('mute', 60)} className="block w-full text-left px-4 py-2 text-sm hover:bg-surface/80">Мут на 1 час</button>
            <button onClick={() => handleAction('deleteAll')} className="block w-full text-left px-4 py-2 text-sm hover:bg-surface/80 text-danger rounded-b-lg">Удалить все сообщения</button>
        </div>
    );
};


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
    <div className="fixed inset-0 bg-bg/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface text-text rounded-xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <img
            className="w-12 h-12 rounded-full object-cover"
            src={(user.avatarUrl && String(user.avatarUrl).trim()) || `https://placehold.co/48x48/1f2937/ffffff?text=${(user.username || 'U')[0]}`}
            alt="avatar"
          />
          <div>
            <div className="font-bold text-lg">{user.username || 'Игрок'}</div>
            <div className="text-sm text-muted">ID: {user.id || '—'}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xl font-bold">{stats.wins || 0}</div>
            <div className="text-xs text-muted">Победы</div>
          </div>
          <div>
            <div className="text-xl font-bold">{stats.losses || 0}</div>
            <div className="text-xs text-muted">Поражения</div>
          </div>
          <div>
            <div className="text-xl font-bold">{winRate}%</div>
            <div className="text-xs text-muted">Винрейт</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-surface hover:bg-surface/80 rounded-lg py-2 font-semibold"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

const formatTime = (ts) => {
  try {
    return new Date(ts || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const LobbyScreen = ({ user, onLogout, setPage, rooms, siteSettings }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gameMode, setGameMode] = useState('Подкидной');
  const [numPlayers, setNumPlayers] = useState(2);
  const [bet, setBet] = useState(100);
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [profileOpen, setProfileOpen] = useState(null);
  const [joinPrompt, setJoinPrompt] = useState(null);
  const [cancelPrompt, setCancelPrompt] = useState(null);
  const chatEndRef = useRef(null);
  const [moderationMenu, setModerationMenu] = useState({ isOpen: false, msg: null, position: null });
  const [chatLoading, setChatLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);


  useEffect(() => {
    const historyHandler = (history) => {
      setChatMessages(Array.isArray(history) ? history : []);
      setChatLoading(false);
    };
    const newMessageHandler = (newMessage) => {
      setChatMessages((prev) => [...prev, newMessage]);
      setChatLoading(false);
    };
    const deletedMessageHandler = ({ messageId }) => setChatMessages((prev) => prev.filter(m => m.id !== messageId));
    const deletedAllUserMessagesHandler = ({ userId }) => setChatMessages((prev) => prev.filter(m => m.user.id !== userId));

    socketService.on('global_chat_history', historyHandler);
    socketService.on('new_global_message', newMessageHandler);
    socketService.on('deleted_global_message', deletedMessageHandler);
    socketService.on('deleted_all_user_messages', deletedAllUserMessagesHandler);

    if (socketService.requestGlobalChat) socketService.requestGlobalChat();

    return () => {
      socketService.off('global_chat_history', historyHandler);
      socketService.off('new_global_message', newMessageHandler);
      socketService.off('deleted_global_message', deletedMessageHandler);
      socketService.off('deleted_all_user_messages', deletedAllUserMessagesHandler);
    };
  }, []);

  useEffect(() => {
    setRoomsLoading(false);
  }, [rooms]);

  useEffect(() => {
    const onUserStats = ({ userId, stats }) => {
      setProfileOpen((prev) =>
        !prev || prev.id !== userId ? prev : { ...prev, stats: stats || { wins: 0, losses: 0 } }
      );
    };
    socketService.on('user_stats', onUserStats);
    return () => socketService.off('user_stats', onUserStats);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const openProfile = (u) => {
    if (!u) return;
    setProfileOpen({ ...u, stats: u.stats || { wins: 0, losses: 0 } });
    if (u.id) socketService.requestUserStats(u.id);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      socketService.sendGlobalMessage(message);
      setMessage('');
    }
  };

  const handleCreateRoom = () => {
    if (Array.isArray(rooms) && rooms.some(r => r.players?.some?.(p => p.socketId === socketService.getSocketId()))) { return; }
    socketService.createRoom({
      mode: gameMode,
      players: numPlayers,
      bet: Number(bet) || 0,
      creatorName: user.username,
    });
    setShowCreateModal(false);
  };

  const handleJoinGame = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      setJoinPrompt(room);
    }
  };

  const handleModerationAction = (action, messageId, userId, value) => {
    switch (action) {
      case 'delete':
        socketService.deleteChatMessage(messageId);
        break;
      case 'mute':
        socketService.muteUser(userId, value);
        break;
      case 'deleteAll':
        socketService.deleteAllUserMessages(userId);
        break;
      default:
        break;
    }
  };
  
  const handleOpenModerationMenu = (e, msg) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 192; // w-48
    setModerationMenu({
        isOpen: true,
        msg,
        position: {
            // Располагаем меню слева от кнопки, 5px ниже
            left: rect.left - menuWidth + rect.width,
            top: rect.top + rect.height + 5,
        }
    });
  };

  const handleCloseModerationMenu = () => {
    setModerationMenu({ isOpen: false, msg: null, position: null });
  };


  const mySocketId = socketService.getSocketId();
  const iAmInAnyRoom = Array.isArray(rooms) && rooms.some(r => r.players?.some?.(p => p.socketId === mySocketId));


  return (
    <div className="min-h-screen flex flex-col p-4 lg:p-8 bg-bg text-text">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">DURAK.IO</h1>
        <div className="flex items-center space-x-4">
          <button onClick={() => setPage('leaderboard')} className="hidden md:flex items-center gap-2 hover:text-primary"><TrophyIcon /> Рейтинги</button>
          <button onClick={() => setPage('wallet')} className="hidden md:flex items-center gap-2 hover:text-primary"><WalletIcon /> {user.balance} ₽</button>
          <button onClick={() => setPage('profile')} className="hidden md:flex items-center gap-2 hover:text-primary"><UserIcon /> Профиль</button>
          <div className="flex items-center gap-1">
            <img className="w-12 h-12 rounded-full border-2 border-primary object-cover" src={resolveAvatarUrl(user.avatarUrl, `https://placehold.co/48x48/1f2937/ffffff?text=${user.username.charAt(0)}`)} alt="avatar" />
            <span className="font-semibold">{user.username}</span>
            {user.role === 'admin' && <AdminBadge />}
          </div>
          {user.role === 'admin' && <button onClick={() => setPage('admin')} className="p-2 bg-surface rounded-lg hover:bg-surface/80"><SettingsIcon /></button>}
          <button onClick={onLogout} className="p-2 bg-surface rounded-lg hover:bg-surface/80"><LogoutIcon /></button>
        </div>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row gap-8">
        {/* столы */}
        <div className="w-full lg:w-2/3 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold">Игровые столы</h2>
            <button onClick={() => !iAmInAnyRoom && setShowCreateModal(true)} className="px-6 py-3 font-bold rounded-lg bg-primary hover:bg-primary/80 transition-colors" disabled={iAmInAnyRoom} title={iAmInAnyRoom ? "Нельзя: у вас есть активная игра" : ""}>Создать игру</button>
          </div>

          <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 flex-grow">
            {roomsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <RoomCardSkeleton key={i} />)
            ) : (
              Array.isArray(rooms) && rooms.map((room) => {
                const iAmHere = room.players.some((p) => p.socketId === mySocketId);
                return (
                  <div key={room.id} className={`p-4 rounded-lg flex items-center justify-between border transition-all ${iAmHere ? "bg-surface/80 border-primary shadow-[0_0_0_3px_rgba(22,163,74,0.2)]" : "bg-surface border-border"}`}>
                    <div>
                      <h3 className="font-bold text-lg">{room.name}</h3>
                      <p className="text-sm text-muted">
                        {room.mode}, Ставка: {room.bet} ₽ • {room.status === 'waiting' ? `Ожидание (ещё ${Math.max(0, (Number(room.maxPlayers||2) - Number(room.players?.length||0)))})` : 'В игре'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center font-bold text-lg">
                        {room.players.length}/{room.maxPlayers}
                      </div>
                      {iAmHere ? (
                        <>
                          <button onClick={() => setPage('game')} className="font-bold py-2 px-6 rounded-lg bg-primary hover:bg-primary/80">
                            Вернуться
                          </button>
                          {(room.status === 'waiting' && room.creatorId === user.id) && (
                            <button
                              onClick={() => setCancelPrompt(room)}
                              className="font-bold py-2 px-4 rounded-lg bg-danger hover:bg-danger/80 transition-colors"
                              title="Отменить стол (пока идёт поиск игроков)"
                            >
                              Отменить
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => handleJoinGame(room.id)}
                          disabled={room.players.length >= room.maxPlayers || room.status === 'playing'}
                          className="font-bold py-2 px-6 rounded-lg bg-primary hover:bg-primary/80 disabled:bg-border"
                        >
                          {room.status === 'playing' ? 'Идёт игра' : 'Играть'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {!roomsLoading && rooms.length === 0 && <p className="text-center text-muted">Открытых столов нет.</p>}
          </div>
        </div>

        {/* общий чат */}
        <div className="w-full lg:w-1/3 flex flex-col">
          <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-4 flex flex-col flex-grow">
            <h2 className="text-xl font-semibold mb-4 text-center">Общий чат</h2>

            <div className="flex-grow space-y-1 overflow-y-auto custom-scroll p-2 mb-4 max-h-[60vh] md:max-h-[70vh]">
              {chatLoading ? (
                Array.from({ length: 5 }).map((_, i) => <ChatMessageSkeleton key={i} />)
              ) : (
                <AnimatePresence initial={false}>
                  {Array.isArray(chatMessages) && chatMessages.map((msg, index) => {
                    const isMine = (msg.user?.id && user?.id && msg.user.id === user.id) || (msg.user?.username === user?.username);
                    const userRole = msg.user?.role;
                    const nameColor = userRole === 'admin' ? 'text-accent' : userRole === 'moderator' ? 'text-primary' : 'text-text';
                    const canModerate = user && ['admin', 'moderator'].includes(user.role) && user.id !== msg.user?.id;

                    return (
                      <motion.div
                        key={msg.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`flex items-end gap-1.5 mb-1 ${isMine ? 'justify-end' : ''}`}
                      >
                        {!isMine && (
                          <img
                            className="w-8 h-8 rounded-full object-cover cursor-pointer self-start"
                            src={resolveAvatarUrl(msg.user?.avatarUrl, `https://placehold.co/32x32/1f2937/ffffff?text=${(msg.user?.username || 'U')[0]}`)}
                            alt="avatar"
                            onClick={() => openProfile(msg.user)}
                            title="Открыть профиль"
                          />
                        )}
                        <div className={`group flex items-center gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div
                            className={`flex flex-col w-fit max-w-xs leading-1.5 px-3 py-1.5 rounded-lg ${
                              isMine ? 'bg-primary/20 rounded-br-none' : 'bg-surface rounded-bl-none'
                            }`}
                          >
                            <span className={`text-sm font-semibold ${nameColor} flex items-center gap-1`}>
                              {msg.user?.username || 'Игрок'}
                              {msg.user?.role === 'admin' && <AdminBadge />}
                            </span>
                            <p className="text-sm font-normal text-text" style={{ wordBreak: 'break-word' }}>{msg.text}</p>
                            <div className="text-[10px] text-muted mt-0.5 self-end">
                              {formatTime(msg.createdAt || msg.timestamp)}
                            </div>
                          </div>
                          {canModerate && (
                            <button
                              onClick={(e) => handleOpenModerationMenu(e, msg)}
                              className="self-center text-muted hover:text-text opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="flex items-center">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => (e.key === 'Enter' ? handleSendMessage() : null)}
                placeholder="Сообщение..."
                className="flex-grow bg-surface border border-border rounded-l-lg p-2"
              />
              <button
                onClick={handleSendMessage}
                className="bg-primary text-text font-bold p-2 rounded-r-lg hover:bg-primary/80"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Модальные окна */}
      <ModerationMenu 
        menuData={moderationMenu} 
        onAction={handleModerationAction} 
        onClose={handleCloseModerationMenu} 
      />
      {profileOpen && <ProfileModal user={profileOpen} onClose={() => setProfileOpen(null)} />}
      {showCreateModal && (
        <div className="fixed inset-0 bg-bg/60 flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-surface rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-semibold mb-6">Создать игру</h2>

            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={() => setGameMode('Подкидной')}
                className={`px-6 py-2 rounded-lg transition-colors ${gameMode === 'Подкидной' ? 'bg-primary hover:bg-primary/80' : 'bg-surface hover:bg-surface/80'}`}
              >
                Подкидной
              </button>
              <button
                onClick={() => setGameMode('Переводной')}
                className={`px-6 py-2 rounded-lg transition-colors ${gameMode === 'Переводной' ? 'bg-primary hover:bg-primary/80' : 'bg-surface hover:bg-surface/80'}`}
              >
                Переводной
              </button>
            </div>

            <div className="mb-4">
              <label>Игроков:</label>
              <select
                value={numPlayers}
                onChange={(e) => setNumPlayers(parseInt(e.target.value))}
                className="ml-2 bg-surface rounded-lg px-4 py-2"
              >
                {Array.from({length: Math.max(0, (Number(siteSettings?.maxPlayersLimit||6) - 1))}, (_,i)=>i+2).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label>Ставка (₽):</label>
              <input
                type="number"
                value={bet}
                onChange={(e) => setBet(e.target.value)}
                className="ml-2 bg-surface rounded-lg px-4 py-2 w-32 text-right"
              />
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowCreateModal(false)} className="w-full py-3 bg-border hover:bg-border/80 rounded-lg transition-colors">
                Отмена
              </button>
              <button onClick={handleCreateRoom} className="w-full py-3 bg-primary hover:bg-primary/80 rounded-lg transition-colors">
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
      {joinPrompt && (
        <ConfirmDialog
          open={!!joinPrompt}
          title={`Войти в стол «${joinPrompt.name}»?`}
          message={`Ставка: ${joinPrompt.bet} ₽.\nИгроков: ${joinPrompt.players.length} из ${joinPrompt.maxPlayers}.`}
          confirmText="Войти"
          onConfirm={() => {
            socketService.joinRoom(joinPrompt.id);
            setJoinPrompt(null);
          }}
          onCancel={() => setJoinPrompt(null)}
        />
      )}
      {cancelPrompt && (
        <ConfirmDialog
          open={!!cancelPrompt}
          title="Отменить созданный стол?"
          message="Вы уверены? Игроки, ожидающие в этой комнате, будут возвращены в лобби."
          confirmText="Да, отменить"
          onConfirm={() => {
            socketService.cancelRoom(cancelPrompt.id);
            setCancelPrompt(null);
          }}
          onCancel={() => setCancelPrompt(null)}
        />
      )}
    </div>
  );
};

export default LobbyScreen;


<style>{`
  /* Стилизация скроллбара под минимализм сайта */
  .custom-scroll::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scroll::-webkit-scrollbar-thumb {
    background-color: rgba(255,255,255,0.3);
    border-radius: 3px;
  }
  .custom-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.3) transparent;
  }
`}</style>