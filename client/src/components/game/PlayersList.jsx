import React from 'react';

function Opponent({ player }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative">
        <img
          src={player.avatar}
          alt={player.name}
          className="relative z-10 h-12 w-12 rounded-full ring-2 ring-white/70 shadow"
        />
        {/* Мини-веер рубашек наполовину под аватаром */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-0 pointer-events-none">
          <div className="flex gap-1">
            {Array.from({ length: Math.min(player.cardsCount ?? 6, 6) }).map((_, i) => (
              <div
                key={i}
                className="h-6 w-4 bg-[url('/assets/card-back.svg')] bg-cover bg-center rounded-sm shadow -mx-0.5"
                style={{ transform: `translateY(${i % 2 ? 2 : 0}px) rotate(${(i - 2) * 3}deg)` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{player.name}</div>
        <div className="text-xs text-white/60 truncate">{player.status}</div>
      </div>

      <div className="text-xs text-white/70">{player.cardsCount}</div>
    </div>
  );
}

// Список оппонентов; если нет данных — показываем демо-элемент
export default function PlayersList({ players = [] }) {
  const demo = players.length
    ? players
    : [
        { name: 'Opponent', status: 'Готов', avatar: '/assets/avatar-demo.png', cardsCount: 6 },
      ];
  return (
    <div className="bg-white/5 rounded-xl p-3 backdrop-blur">
      {demo.map((p, idx) => (
        <Opponent key={idx} player={p} />
      ))}
    </div>
  );
}
