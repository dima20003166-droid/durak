import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCounter from '../components/AnimatedCounter';
import socketService from '../services/socketService';
import ConfirmDialog from '../components/ConfirmDialog';
import AdminBadge from '../components/AdminBadge';
import resolveAvatarUrl from '../utils/resolveAvatarUrl';
import ProfileModal from '../components/game/ProfileModal';
import CreateRoomModal from '../components/CreateRoomModal';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

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




const formatTime = (ts) => {
  try {
    return new Date(ts || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12V8H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h12v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/>
  </svg>
);
const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

const LobbyScreen = ({ user, onLogout, setPage, rooms, siteSettings, openAuthModal }) => {
  const { t } = useTranslation();
  const [createMode, setCreateMode] = useState('classic');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const startCreate = (mode) => {
    setCreateMode(mode);
    setShowCreateModal(true);
  };
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [profileOpen, setProfileOpen] = useState(null);
  const [joinPrompt, setJoinPrompt] = useState(null);
  const [cancelPrompt, setCancelPrompt] = useState(null);
  const chatEndRef = useRef(null);
  const [moderationMenu, setModerationMenu] = useState({ isOpen: false, msg: null, position: null });


  useEffect(() => {
    const historyHandler = (history) => setChatMessages(Array.isArray(history) ? history : []);
    const newMessageHandler = (newMessage) => setChatMessages((prev) => [...prev, newMessage]);
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
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-primary">DURAK.IO</h1>
        <div className="flex items-center space-x-4">
          <button onClick={() => setPage('leaderboard')} className="hidden md:flex items-center gap-2 hover:text-primary"><TrophyIcon /> {t('ratings')}</button>
          {user ? (
            <>
              <button onClick={() => setPage('wallet')} className="hidden md:flex items-center gap-2 hover:text-primary"><WalletIcon /> <AnimatedCounter value={user.balance || 0} /> ₽</button>
              <button onClick={() => setPage('profile')} className="hidden md:flex items-center gap-2 hover:text-primary"><UserIcon /> {t('profile')}</button>
              <div className="flex items-center gap-1">
                <img className="w-12 h-12 rounded-full border-2 border-primary object-cover" src={resolveAvatarUrl(user.avatarUrl, `https://placehold.co/48x48/1f2937/ffffff?text=${(user.username || 'U')[0]}` , socketService?.getServerUrl ? socketService.getServerUrl() : undefined)} alt="avatar" title={t('openProfile')} />
                <span className="font-semibold">{user.username}</span>
                {user.role === 'admin' && <AdminBadge />}
              </div>
              {user.role === 'admin' && <button onClick={() => setPage('admin')} className="p-2 bg-surface rounded-lg hover:bg-surface/80"><SettingsIcon /></button>}
              <button onClick={onLogout} className="p-2 bg-surface rounded-lg hover:bg-surface/80"><LogoutIcon /></button>
            </>
          ) : (
            <button onClick={openAuthModal} className="px-4 py-2 bg-primary text-text rounded-lg hover:bg-primary/80">{t('auth')}</button>
          )}
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row gap-8">
        {/* столы */}
        <div className="w-full lg:w-2/3 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold">{t('gameTables')}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => startCreate('classic')}
                className="px-6 py-3 font-bold rounded-lg bg-primary hover:bg-primary/80 transition-colors"
                disabled={!user || iAmInAnyRoom}
                title={!user ? 'Требуется авторизация' : iAmInAnyRoom ? 'Нельзя: у вас есть активная игра' : ''}
              >
                Дурак
              </button>
              <button
                onClick={() => setPage('jackpot')}
                className="px-6 py-3 font-bold rounded-lg bg-primary hover:bg-primary/80 transition-colors"
                disabled={!user || iAmInAnyRoom}
                title={!user ? 'Требуется авторизация' : iAmInAnyRoom ? 'Нельзя: у вас есть активная игра' : ''}
              >
                Косинка
              </button>
            </div>
          </div>

          <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 flex-grow">
            <AnimatePresence>
              {rooms.map((room, idx) => {
                const iAmHere = room.players.some((p) => p.socketId === mySocketId);
                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-lg flex items-center justify-between border transition-all ${iAmHere ? "bg-surface/80 border-primary shadow-[0_0_0_3px_rgba(22,163,74,0.2)]" : "bg-surface border-border"}`}
                  >
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
                          {(room.status === 'waiting' && user && room.creatorId === user.id) && (
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
                          onClick={() => user && handleJoinGame(room.id)}
                          disabled={!user || room.players.length >= room.maxPlayers || room.status === 'playing'}
                          className="font-bold py-2 px-6 rounded-lg bg-primary hover:bg-primary/80 disabled:bg-border"
                          title={!user ? 'Требуется авторизация' : ''}
                        >
                          {room.status === 'playing' ? 'Идёт игра' : 'Играть'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {rooms.length === 0 && <p className="text-center text-muted">Открытых столов нет.</p>}
          </div>
        </div>

        {/* общий чат */}
        <div className="w-full lg:w-1/3 flex flex-col">
          <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-4 flex flex-col flex-grow">
            <h2 className="text-xl font-semibold mb-4 text-center">Общий чат</h2>

            <div className="flex-grow space-y-1 overflow-y-auto custom-scroll p-2 mb-4 max-h-[60vh] md:max-h-[70vh]">
            {chatMessages.map((msg, index) => { 
                const isMine = (msg.user?.id && user?.id && msg.user.id === user.id) || (msg.user?.username === user?.username);
                const userRole = msg.user?.role;
                const nameColor = userRole === 'admin' ? 'text-accent' : userRole === 'moderator' ? 'text-primary' : 'text-text';
                const canModerate = user && ['admin', 'moderator'].includes(user.role) && user.id !== msg.user?.id;

                return (
                    <div key={msg.id || index} className={`flex items-end gap-1.5 mb-1 ${isMine ? 'justify-end' : ''}`}>
                    {!isMine && (
                        <img
                        className="w-8 h-8 rounded-full object-cover cursor-pointer self-start"
                        src={resolveAvatarUrl(msg.user?.avatarUrl, `https://placehold.co/32x32/1f2937/ffffff?text=${(msg.user?.username || 'U')[0]}` , socketService?.getServerUrl ? socketService.getServerUrl() : undefined)}
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
                        {canModerate && 
                            <button onClick={(e) => handleOpenModerationMenu(e, msg)} className="self-center text-muted hover:text-text opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                            </button>
                        }
                    </div>
                    </div>
                );
                })}
              <div ref={chatEndRef} />
            </div>

              <div className="flex items-center">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => (user && e.key === 'Enter' ? handleSendMessage() : null)}
                  placeholder={user ? t('messagePlaceholder') : t('authOnly')}
                  className="flex-grow bg-surface border border-border rounded-l-lg p-2"
                  disabled={!user}
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-primary text-text font-bold p-2 rounded-r-lg hover:bg-primary/80 disabled:bg-border"
                  disabled={!user}
                >
                  {t('send')}
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
        <CreateRoomModal
          initialMode={createMode}
          onClose={() => setShowCreateModal(false)}
        />
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