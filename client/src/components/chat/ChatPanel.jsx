import React, { useState } from 'react';

export default function ChatPanel() {
  const [message, setMessage] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    // TODO: заменить на реальную отправку в сокет/сервер
    console.log('[chat] send:', message);
    setMessage('');
  };

  return (
    <div className="h-[380px] md:h-full bg-white/5 rounded-xl backdrop-blur flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-1">
        {/* Сообщения чата */}
      </div>
      <div className="border-t border-white/10 p-2">
        <form className="grid grid-cols-[1fr_auto] gap-2" onSubmit={handleSend}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Повідомлення… / Сообщение…"
            className="h-10 px-3 rounded bg-white/10 focus:bg-white/15 outline-none"
          />
          <button
            type="submit"
            className="h-10 px-4 rounded bg-sky-500 hover:bg-sky-600 active:scale-[.98] transition"
          >
            Відправити / Отправить
          </button>
        </form>
      </div>
    </div>
  );
}
