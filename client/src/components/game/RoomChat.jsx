import React, { useRef, useEffect, useState } from 'react';
import resolveAvatarUrl from '../../utils/resolveAvatarUrl';

export default function RoomChat({ chat = [], myPlayer, onSend, openProfile }) {
  const [text, setText] = useState('');
  const bodyRef = useRef(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat.length]);

  const handleSend = () => {
    const msg = text.trim();
    if (!msg) return;
    onSend?.(msg);
    setText('');
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-border border-opacity-60 p-4 chatPanel h-[520px]">
      <h3 className="text-lg font-semibold mb-3">Чат стола</h3>
      <div ref={bodyRef} className="chatBody space-y-3">
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
                  onClick={() => openProfile?.(m.user)}
                  alt=""
                />
              )}
              <div className={`max-w-[80%] rounded-xl border border-border border-opacity-60 px-3 py-2 text-sm ${isMine ? 'bg-primary bg-opacity-10' : 'bg-[#121230]'}`}>
                <div className="text-muted text-xs mb-0.5">{m.user?.username || 'Гость'}</div>
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
              {isMine && (
                <img
                  className="w-7 h-7 rounded-full object-cover"
                  src={resolveAvatarUrl(myPlayer?.avatarUrl, `https://placehold.co/28x28/1f2937/ffffff?text=${myPlayer?.username?.[0] || 'U'}`)}
                  alt=""
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="chatControls">
        <textarea
          className="flex-1 rounded-lg bg-[#0c0c22] border border-border border-opacity-60 px-3 py-2 text-sm resize-none h-10 focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Напишите сообщение…"
        />
        <button
          onClick={handleSend}
          className="shrink-0 px-4 h-10 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold shadow transition"
        >
          Отправить
        </button>
      </div>
    </div>
  );
}
