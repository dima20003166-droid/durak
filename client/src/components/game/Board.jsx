import React from 'react';
import { motion } from 'framer-motion';

/**
 * Центральная зона стола: колода/козырь и карты атаки/защиты.
 * Только UI. Бизнес-логику не меняем.
 */
export default function Board({ trump, deckCount = 24, tableCards = [], discard = [] }) {
  const maxStack = Math.min(deckCount, 6);

  return (
    <div className="panel relative h-[360px] md:h-[420px] xl:h-[460px] overflow-hidden">
      {/* Стопка колоды */}
      <div className="absolute left-2 md:left-4 bottom-2 md:bottom-4 w-[80px] h-[120px]">
        <div className="relative w-full h-full">
          {Array.from({ length: maxStack }).map((_, i) => (
            <div key={i} className="deck-card" style={{ transform: `translate(${i * 3}px, -${i * 3}px) rotate(${i * 1.5}deg)` }} />
          ))}
        </div>
        {trump ? (
          <div className="absolute -right-8 rotate-12">
            <div className="w-[80px] h-[120px] rounded-xl bg-neutral-800 border border-white/10" />
          </div>
        ) : null}
      </div>

      {/* Карты на столе */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[88%] h-[70%]">
          {tableCards.map((pair, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute" style={{ left: `${10 + idx * 10}%`, top: `${18 + (idx % 2) * 22}%` }}>
              <div className="w-[90px] h-[130px] rounded-xl bg-neutral-700/60 border border-white/10 shadow-glow" />
              {pair.defense && (<div className="absolute left-5 top-5 rotate-12 w-[90px] h-[130px] rounded-xl bg-neutral-800/80 border border-white/10" />)}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Отбой */}
      {discard?.length ? (
        <div className="absolute right-2 md:right-4 top-2 md:top-4 w-[140px] h-[120px]">
          <div className="relative discard-stack w-full h-full">
            {discard.slice(-6).map((c, i) => (
              <div key={i} className="card w-[90px] h-[130px] rounded-xl bg-neutral-700/60 border border-white/10" style={{ left: `${i * 12}px`, top: `${i * 6}px`, transform: `rotate(${6 + i * 4}deg)` }} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
