import React, { useEffect, useRef } from 'react';
import socketService from '../services/socketService';
import resolveAvatarUrl from '../utils/resolveAvatarUrl';

const RoomChat = ({ chat, msg, setMsg, sendRoomMessage, openProfile }) => {
  const chatEndRef = useRef(null);
  const mySocketId = socketService.getSocketId();

  useEffect(() => {
    try {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }, [chat]);

  return (
    <div className="bg-surface rounded-xl border border-border p-4 flex flex-col">
      <div className="font-semibold mb-2">Чат стола</div>
      <div className="flex-1 overflow-y-auto custom-scroll space-y-2 max-h-64 md:max-h-80">
        {chat.map((m, i) => {
          const isMine = m.user?.socketId === mySocketId;
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
      <div className="flex mt-2">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => (e.key === 'Enter' ? sendRoomMessage() : null)}
          className="flex-1 bg-surface rounded-l px-2 py-1"
          placeholder="Сообщение..."
        />
        <button
          className="bg-primary hover:bg-primary/80 rounded-r px-3 transition-colors"
          onClick={sendRoomMessage}
        >
          Отправить
        </button>
      </div>
    </div>
  );
};

export default RoomChat;
