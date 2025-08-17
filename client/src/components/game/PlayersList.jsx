
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../Card';
import resolveAvatarUrl from '../../utils/resolveAvatarUrl';

const Badge = ({ text }) => (
  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-text/90 border border-border">
    {text}
  </span>
);

export default function PlayersList({
  room,
  mySocketId,
  myPlayer,
  gameState,
  selectedCard,
  setSelectedCard,
  openProfile,
}) {
  const myIdx = room.players.findIndex((x) => x.socketId === mySocketId);
  const ordered = myIdx >= 0 ? [...room.players.slice(myIdx), ...room.players.slice(0, myIdx)] : room.players;
  const me = ordered[0];
  const others = ordered.slice(1);

  const renderOpponent = (p) => {
    const idx = room.players.findIndex((x) => x.socketId === p.socketId);
    const isAttacker = idx === gameState.attackerIndex;
    const isDefender = idx === gameState.defenderIndex;
    const totalVisible = Math.min(8, p.hand?.length || 0);
    const spread = Math.min(14, 6 + totalVisible * 1.2);
    const step = (spread * 2) / Math.max(totalVisible - 1, 1);

    return (
      <div key={p.socketId} className="player-badge">
        <img
          className="avatar"
          src={resolveAvatarUrl(p.avatarUrl) || `https://placehold.co/64x64/1f2937/ffffff?text=${(p.username||'P')[0]}`}
          onClick={() => openProfile(p)}
          alt=""
        />
        <div className="name" onClick={() => openProfile(p)}>{p.username}</div>
        <div className="opponent-fan">
          {Array.from({ length: totalVisible }).map((_, i) => {
            const angle = -spread + i * step;
            const shift = -36 + i * (72 / Math.max(totalVisible - 1, 1));
            return (
              <div key={i} className="card" style={{ transform:`translateX(${shift}px) rotate(${angle}deg)` }}>
                <div className="card-back"></div>
              </div>
            );
          })}
        </div>
        {(isAttacker || isDefender) && <Badge text={isAttacker ? 'Атака' : 'Защита'} />}
      </div>
    );
  };

  const renderMe = () => {
    const hand = myPlayer.hand || [];
    const total = hand.length;
    const mid = (total - 1) / 2;
    const base = 44; // spacing px
    return (
      <div className="my-hand">
        {hand.map((card, i) => {
          const offset = (i - mid) * base;
          const rot = (i - mid) * 6;
          const isSel = selectedCard?.id === card.id;
          return (
            <motion.div
              key={card.id}
              className="card-wrap"
              style={{ left: `calc(50% + ${offset}px)`, '--rot': `${rot}deg` }}
              whileHover={{ y: -8 }}
            >
              <Card
                {...card}
                layoutId={card.id}
                isSelected={isSel}
                onClick={() => setSelectedCard(card)}
              />
            </motion.div>
          );
        })}
      </div>
    );
  };

  const battlefield = (
    <div className="battlefield">
      <AnimatePresence>
        {gameState.table.map((pair) => (
          <motion.div
            key={pair.attack.id}
            className="relative w-20 h-28"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            layout
          >
            <Card {...pair.attack} layoutId={pair.attack.id} />
            {pair.defense && (
              <div className="absolute left-8 top-6 rotate-[12deg]">
                <Card {...pair.defense} layoutId={pair.defense.id} />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="table-slots">
      <div className="slot-top">
        {others.map(renderOpponent)}
      </div>
      <div className="slot-left" />
      <div className="slot-right" />
      {battlefield}
      <div className="slot-bottom">
        {renderMe()}
      </div>
    </div>
  );
}
