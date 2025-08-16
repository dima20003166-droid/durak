import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import Button from '../Button';
import resolveAvatarUrl from '../../utils/resolveAvatarUrl';

const RoomChat = ({ chat, myPlayer, onSend, openProfile }) => {
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    try {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }, [chat]);

  const send = () => {
    const text = String(msg || '');
    if (!text.trim()) return;
    onSend(text);
    setMsg('');
  };

  return (
    <motion.div className="h-full flex flex-col" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}>
      <Button
        className="md:hidden mb-2 w-10 h-10 p-0"
        variant="primary"
        onClick={() => setOpen(true)}
      >
        💬
      </Button>
      <div
        className={`chatPanel grid bg-surface rounded-xl border border-border md:static md:translate-x-0 md:w-full md:h-full fixed top-0 right-0 h-full w-64 z-50 transition-transform ${open ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}
      >
        <button
          className="md:hidden absolute top-2 left-2 text-text"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
        <div className="chatMessages p-4 space-y-2 custom-scroll">
          <div className="font-semibold mb-2">Чат стола</div>
        {chat.map((m, i) => {
          const isMine =
            (m.user?.id && myPlayer?.id && m.user.id === myPlayer.id) ||
            m.user?.username === myPlayer?.username;
          return (
            <div key={i} className={`flex items-start gap-2 ${isMine ? 'justify-end' : ''}`}>
              {!isMine && (
                <img
                  className="w-7 h-7 rounded-full object-cover cursor-pointer"
                  src={resolveAvatarUrl(
                    m.user?.avatarUrl,
                    `https://placehold.co/28x28/1f2937/ffffff?text=${m.user?.username?.[0] || 'U'}`
                  )}
                  onClick={() => openProfile(m.user)}
                  alt=""
                />
              )}
              <div className={`rounded-lg px-3 py-2 max-w-[240px] ${isMine ? 'bg-primary/20' : 'bg-surface'}`}>
                <div
                  className="text-xs text-muted cursor-pointer"
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
                  src={resolveAvatarUrl(
                    m.user?.avatarUrl,
                    `https://placehold.co/28x28/1f2937/ffffff?text=${m.user?.username?.[0] || 'U'}`
                  )}
                  onClick={() => openProfile(m.user)}
                  alt=""
                />
              )}
            </div>
          );
        })}
          <div ref={chatEndRef} />
        </div>
        <form
          className="chatInputRow"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className="bg-surface rounded px-2 py-1"
            placeholder="Сообщение..."
          />
          <button type="submit" className="bg-primary text-text px-3 py-1 rounded">
            Отправить
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default RoomChat;

RoomChat.propTypes = {
  chat: PropTypes.array,
  myPlayer: PropTypes.object,
  onSend: PropTypes.func,
  openProfile: PropTypes.func,
};
