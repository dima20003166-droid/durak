import React from 'react';
import { motion } from 'framer-motion';
import Card from '../Card';
import resolveAvatarUrl from '../../utils/resolveAvatarUrl';

const PlayersList = ({
  room,
  mySocketId,
  myPlayer,
  gameState,
  selectedCard,
  setSelectedCard,
  openProfile,
}) => {
  const myIdx = room.players.findIndex((x) => x.socketId === mySocketId);
  const orderedPlayers =
    myIdx >= 0
      ? [...room.players.slice(myIdx), ...room.players.slice(0, myIdx)]
      : room.players;

  const others = orderedPlayers.slice(1);
  const topPlayers = [];
  const leftPlayers = [];
  const rightPlayers = [];
  others.forEach((p, i) => {
    if (i % 3 === 0) topPlayers.push(p);
    else if (i % 3 === 1) rightPlayers.push(p);
    else leftPlayers.push(p);
  });

  const renderPlayer = (p, isMine = false) => {
    const idx = room.players.findIndex((x) => x.socketId === p.socketId);
    const isCurrentAttacker = idx === gameState.attackerIndex;
    const isCurrentDefender = idx === gameState.defenderIndex;
    const ringClass = isCurrentAttacker
      ? 'ring-4 ring-primary animate-pulse'
      : isCurrentDefender
      ? 'ring-4 ring-accent'
      : '';
    return (
      <div
        key={p.socketId}
        className={`flex flex-col items-center bg-surface rounded p-2 mb-2 basis-1/4 md:basis-1/6 ${ringClass}`}
      >
        <div
          className={`mb-1 text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
            isCurrentAttacker ? 'bg-danger' : ''
          } ${isCurrentDefender ? 'bg-accent' : ''}`}
        >
          {isCurrentAttacker ? 'Атака' : isCurrentDefender ? 'Защита' : ''}
        </div>
        <img
          className="w-16 h-16 rounded-full object-cover cursor-pointer"
          src={resolveAvatarUrl(
            p.avatarUrl,
            `https://placehold.co/64x64/1f2937/ffffff?text=${p.username.charAt(0)}`
          )}
          onClick={() => openProfile(p)}
          alt=""
        />
        <p
          className="font-semibold mt-1 truncate cursor-pointer w-full text-center"
          onClick={() => openProfile(p)}
        >
          {p.username}
        </p>
        <div className="flex justify-center items-center h-28 w-full mt-2">
          {isMine ? (
            (() => {
              const hand = myPlayer.hand;
              const mid = (hand.length - 1) / 2;
              const width = 60 + hand.length * 24;
              return (
                <div className="relative" style={{ width }}>
                  {hand.map((card, i) => {
                    const offset = i * 24;
                    const rotate = (i - mid) * 8;
                    const translateY = Math.abs(i - mid) * -6;
                    return (
                      <motion.div
                        layout
                        key={card.id}
                        className="absolute" 
                        style={{ left: offset, transform: `translateY(${translateY}px) rotate(${rotate}deg)` }}
                      >
                        <Card
                          {...card}
                          isSelected={selectedCard?.id === card.id}
                          onClick={() => setSelectedCard(card)}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()
          ) : (
            (() => {
              const width = 40 + p.hand.length * 6;
              return (
                <div className="relative" style={{ width }}>
                  {Array(p.hand.length)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="absolute"
                        style={{ left: i * 6, transform: `rotate(${i % 2 ? 3 : -3}deg)` }}
                      >
                        <Card isFaceUp={false} />
                      </div>
                    ))}
                </div>
              );
            })()
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex justify-center gap-4 flex-wrap">
        {topPlayers.map((p) => renderPlayer(p))}
      </div>
      <div className="flex flex-1">
        <div className="hidden md:flex flex-col justify-center items-start gap-4 flex-wrap basis-1/6">
          {leftPlayers.map((p) => renderPlayer(p))}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex flex-col items-center w-24">
              <Card {...gameState.trumpCard} />
              <p className="mt-2">{gameState.deck.length} карт</p>
            </div>
            <div className="flex items-center justify-center gap-4 min-w-[300px] flex-wrap">
              {gameState.table.map((pair, i) => (
                <div key={i} className="relative w-20 h-28">
                  <Card {...pair.attack} className="relative z-0" />
                  {pair.defense && (
                    <Card
                      {...pair.defense}
                      className="absolute inset-0 rotate-12 translate-x-2 translate-y-2 z-10"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="hidden md:flex flex-col justify-center items-end gap-4 flex-wrap basis-1/6">
          {rightPlayers.map((p) => renderPlayer(p))}
        </div>
      </div>
      <div className="flex justify-center gap-4 flex-wrap mt-4">
        {renderPlayer(myPlayer, true)}
      </div>
      <div className="md:hidden flex overflow-x-auto gap-4 mt-2 px-2">
        {leftPlayers.concat(rightPlayers).map((p) => (
          <div key={p.socketId} className="flex-shrink-0">
            {renderPlayer(p)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayersList;
