import React from 'react';
import PlayersList from '../components/game/PlayersList';
import Board from '../components/game/Board';
import ChatPanel from '../components/chat/ChatPanel';

// Лэйаут экрана игры: центрирование стола и адаптивная сетка
export default function GameScreen() {
  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-gradient-to-b from-[#0a0a0f] to-[#121220] text-white">
      <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-3 md:py-4">
        {/* На md+ — три колонки; на мобиле — одна */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_minmax(640px,1fr)_320px] gap-3 md:gap-4 items-stretch">
          <aside className="order-2 md:order-none"><PlayersList /></aside>
          <main className="order-1 md:order-none flex items-center justify-center">
            <Board />
          </main>
          <aside className="order-3"><ChatPanel /></aside>
        </div>
      </div>
    </div>
  );
}
