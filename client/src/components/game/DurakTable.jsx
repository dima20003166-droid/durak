// client/src/components/game/DurakTable.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../Card';
import resolveAvatarUrl from '../../utils/resolveAvatarUrl';

export default function DurakTable({ room, gameState, mySocketId, myPlayer, selectedCard, setSelectedCard, openProfile }) {
  const myIdx = room.players.findIndex((x) => x.socketId === mySocketId);
  const ordered = myIdx >= 0 ? [...room.players.slice(myIdx), ...room.players.slice(0, myIdx)] : room.players;
  const others = ordered.slice(1);

  const left = [], right = [], top = [];
  if (others.length <= 2) { top.push(...others); }
  else if (others.length === 3) { left.push(others[0]); top.push(others[1]); right.push(others[2]); }
  else {
    const half = Math.floor(others.length / 2);
    left.push(...others.slice(0, half));
    right.push(...others.slice(half));
    if (right.length > 1) top.push(right.shift());
  }

  const idxOf = (p) => room.players.findIndex((x) => x.socketId === p.socketId);
  const isAtk = (idx) => idx === gameState.attackerIndex;
  const isDef = (idx) => idx === gameState.defenderIndex;

  const Opp = ({ p }) => {
    const idx = idxOf(p);
    const status = isAtk(idx) ? 'Атака' : isDef(idx) ? 'Защита' : '';
    const visible = Math.min(8, p.hand?.length || 0);
    const spread = Math.min(16, 6 + visible * 1.2);
    const step = (spread * 2) / Math.max(visible - 1, 1);
    return (
      <div className="dt-badge">
        <img className={`dt-avatar ${status ? 'dt-glow' : ''}`} src={resolveAvatarUrl(p.avatarUrl) || `https://placehold.co/64x64/1f2937/ffffff?text=${p.username?.[0] || 'P'}`} alt="" onClick={() => openProfile?.(p)} />
        <div className="dt-name" onClick={() => openProfile?.(p)}>{p.username}</div>
        {status && <div className={`dt-status ${isAtk(idx) ? 'atk' : 'def'}`}>{status}</div>}
        <div className="dt-fan">
          {Array.from({ length: visible }).map((_, i) => {
            const angle = -spread + i * step;
            const shift = -28 + i * (56 / Math.max(visible - 1, 1));
            return (<div key={i} className="dt-fan-card" style={{ transform:`translateX(${shift}px) rotate(${angle}deg)` }}><div className="card-back dt-back"></div></div>);
          })}
        </div>
      </div>
    );
  };

  const MyHand = () => {
    const hand = myPlayer?.hand || [];
    const mid = (hand.length - 1) / 2;
    return (
      <div className="dt-hand">
        {hand.map((card, i) => {
          const offset = (i - mid) * 44;
          const rot = (i - mid) * 6;
          return (
            <div key={card.id} className="dt-hand-wrap" style={{ left:`calc(50% + ${offset}px)`, '--rot': `${rot}deg` }}>
              <Card {...card} layoutId={card.id} isSelected={false} onClick={() => setSelectedCard?.(card)} />
            </div>
          );
        })}
      </div>
    );
  };

  const Battlefield = () => (
    <div className="dt-field">
      <AnimatePresence>
        {gameState.table?.map((pair) => (
          <motion.div key={pair.attack.id} className="dt-cell" initial={{opacity:0, y:-12}} animate={{opacity:1, y:0}} exit={{opacity:0, y:12}} layout>
            <Card {...pair.attack} layoutId={pair.attack.id} />
            {pair.defense && <Card {...pair.defense} layoutId={pair.defense.id} className="dt-defense" />}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="dt-oval">
      <div className="dt-grid">
        <div className="dt-top">{top.map((p) => <Opp key={p.socketId} p={p} />)}</div>
        <div className="dt-left">{left.map((p) => <Opp key={p.socketId} p={p} />)}</div>
        <Battlefield />
        <div className="dt-right">{right.map((p) => <Opp key={p.socketId} p={p} />)}</div>
        <div className="dt-bottom"><MyHand /></div>
      </div>
    </div>
  );
}
