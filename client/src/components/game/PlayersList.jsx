
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../Card';
import resolveAvatarUrl from '../../utils/resolveAvatarUrl';

export default function PlayersList({ room, mySocketId, myPlayer, gameState, selectedCard, setSelectedCard, openProfile }) {
  const myIdx = room.players.findIndex((x) => x.socketId === mySocketId);
  const ordered = myIdx >= 0 ? [...room.players.slice(myIdx), ...room.players.slice(0, myIdx)] : room.players;
  const me = ordered[0];
  const others = ordered.slice(1);

  const renderFan = (hand, isMine=false) => {
    if (isMine) {
      const mid = (hand.length-1)/2;
      return (
        <div className="player-fan" style={{ width: 80 + hand.length*36 }}>
          {hand.map((c,i)=>{
            const angle=(i-mid)*6;
            const offset=i*36;
            return (
              <motion.div key={c.id} className="fan-card" style={{ left:offset, transform:`rotate(${angle}deg)` }}>
                <Card {...c} isSelected={selectedCard?.id===c.id} onClick={()=>setSelectedCard(c)} />
              </motion.div>
            );
          })}
        </div>
      );
    } else {
      const visible = Math.min(8, hand.length);
      const mid = (visible-1)/2;
      return (
        <div className="player-fan" style={{ width: 120 }}>
          {Array.from({length: visible}).map((_,i)=>(
            <div key={i} className="fan-card" style={{ transform:`rotate(${(i-mid)*8}deg) translateY(-10px)` }}>
              <div className="w-12 h-16 card-back rounded-md"></div>
            </div>
          ))}
        </div>
      );
    }
  };

  const renderPlayer = (p,isMine=false) => {
    const idx = room.players.findIndex(x=>x.socketId===p.socketId);
    const isAttacker = idx===gameState.attackerIndex;
    const isDefender = idx===gameState.defenderIndex;
    const statusText = isAttacker?'Атака':isDefender?'Защита':'';
    return (
      <div key={p.socketId} className="player-slot">
        <div className="flex flex-col items-center cursor-pointer" onClick={()=>openProfile(p)}>
          <img className="w-12 h-12 rounded-full object-cover mb-1" src={resolveAvatarUrl(p.avatarUrl,`https://placehold.co/48x48?text=${p.username[0]}`)} alt=""/>
          <span className="text-xs">{p.username}</span>
          {statusText && <span className="px-2 py-0.5 text-xs rounded-full bg-accent text-white">{statusText}</span>}
        </div>
        {renderFan(isMine? myPlayer.hand : p.hand, isMine)}
      </div>
    );
  };

  const topPlayers = others.slice(0, Math.ceil(others.length/2));
  const bottomPlayers = [renderPlayer(me,true)];
  const leftPlayers = others.length>2 ? [renderPlayer(others[1])] : [];
  const rightPlayers = others.length>3 ? [renderPlayer(others[2])] : [];

  const battlefield = (
    <div className="battlefield">
      <AnimatePresence>
        {gameState.table.map(pair=>(
          <div key={pair.attack.id} className="battle-slot">
            <Card {...pair.attack} layoutId={pair.attack.id} className="attack-card"/>
            {pair.defense && <Card {...pair.defense} layoutId={pair.defense.id} className="defense-card"/>}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );

  return { top: topPlayers.map(p=>renderPlayer(p)), bottom: bottomPlayers, left: leftPlayers, right: rightPlayers, center: battlefield };
}
