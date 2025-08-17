import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../Card';
import resolveAvatarUrl from '../../utils/resolveAvatarUrl';

const PlayersList = ({ room, mySocketId, myPlayer, gameState, selectedCard, setSelectedCard, openProfile }) => {
  const myIdx = room.players.findIndex((x) => x.socketId === mySocketId);
  const ordered = myIdx >= 0 ? [...room.players.slice(myIdx), ...room.players.slice(0,myIdx)] : room.players;
  const others = ordered.slice(1);

  const renderOpp = (p) => {
    const idx = room.players.findIndex((x) => x.socketId === p.socketId);
    const isAtk = idx === gameState.attackerIndex;
    const isDef = idx === gameState.defenderIndex;
    return (
      <div key={p.socketId} className="player-badge">
        <img className="avatar" src={resolveAvatarUrl(p.avatarUrl)} alt="" onClick={() => openProfile(p)} />
        <div className="name">{p.username}</div>
        <div className="opponent-fan">
          {Array.from({ length: Math.min(6,p.hand.length) }).map((_,i)=>{
            const total = Math.min(6,p.hand.length);
            const spread = 20; const step = (spread*2)/(Math.max(total-1,1));
            const angle = -spread + i*step; const shift = -40 + i*(80/Math.max(total-1,1));
            return (
              <div key={i} className="card" style={{transform:`translateX(${shift}px) rotate(${angle}deg)`}}>
                <div className="card-back w-12 h-16 rounded-md"></div>
              </div>
            );
          })}
        </div>
        {(isAtk||isDef) && <div className="status">{isAtk?'Атака':'Защита'}</div>}
      </div>
    );
  };

  const myHand = (() => {
    const hand = myPlayer.hand||[];
    const total = hand.length; const mid = (total-1)/2;
    return (
      <div className="my-hand">
        {hand.map((card,i)=>{
          const offset=(i-mid)*40; const rot=(i-mid)*6;
          return (
            <div key={card.id} className="card-wrap" style={{left:`calc(50% + ${offset}px)`, '--rot':`${rot}deg`}}>
              <Card {...card} layoutId={card.id} isSelected={selectedCard?.id===card.id} onClick={()=>setSelectedCard(card)} />
            </div>
          );
        })}
      </div>
    );
  })();

  return (
    <div className="w-full h-full table-slots">
      <div className="slot-top">{others.map(renderOpp)}</div>
      <div className="battlefield">
        <AnimatePresence>
          {gameState.table.map((pair)=>(
            <motion.div key={pair.attack.id} className="relative w-20 h-28" initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}} layout>
              <Card {...pair.attack} layoutId={pair.attack.id} />
              {pair.defense && (
                <Card {...pair.defense} layoutId={pair.defense.id} className="absolute left-8 top-6 rotate-[15deg]" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="slot-bottom">{myHand}</div>
    </div>
  );
};

export default PlayersList;
