import React from 'react';
import { motion } from 'framer-motion';

export default function PlayersList({ players = [], currentId }) {
  const seats = (players || []).slice(0, 6);
  return (
    <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
      {seats.map((p, idx) => (
        <motion.div key={p?.id ?? idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="glass p-2 md:p-3 flex items-center gap-2">
          <div className="relative">
            <img src={p?.avatar} alt="" className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 mini-fan">
              {Array.from({ length: Math.min(p?.cards ?? 0, 6) }).map((_, i) => (
                <div key={i} className="card-back" style={{ left: i * 10, transform: `rotate(${i * 6 - 12}deg)` }} />
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{p?.name ?? 'Игрок'}</div>
            <div className="text-xs text-white/60 truncate">{p?.status ?? ''}</div>
          </div>
          {p?.id === currentId ? (<span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">Вы</span>) : null}
        </motion.div>
      ))}
    </div>
  );
}
