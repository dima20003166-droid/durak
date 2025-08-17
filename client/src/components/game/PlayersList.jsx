import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const statusText = isCurrentAttacker ? 'Атака' : isCurrentDefender ? 'Защита' : '';
    return (
      <div
        key={p.socketId}
        className="flex flex-col items-center p-2 mb-2 basis-1/4 md:basis-1/6"
      >
        {isMine ? (
          <>
            <div
              className={`mb-0 text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                isCurrentAttacker ? 'bg-danger' : ''
              } ${isCurrentDefender ? 'bg-accent' : ''}`}
            >
              {statusText}
            </div>
            <p
              className="font-semibold -mt-1 truncate w-full text-center cursor-pointer"
              onClick={() => openProfile(p)}
            >
              {p.username}
            </p>
          </>
        ) : (
          <>
            <div
              className={`mb-1 text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                isCurrentAttacker ? 'bg-danger' : ''
              } ${isCurrentDefender ? 'bg-accent' : ''}`}
            >
              {statusText}
            </div>
            <img
              className="w-16 h-16 rounded-full object-cover cursor-pointer relative z-10"
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
          </>
        )}
        <div className={`flex justify-center items-center h-28 w-full ${isMine ? '-mt-2' : '-mt-8'}`}>
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
                        key={card.id}
                        className="absolute will-change-transform"
                        style={{ left: offset, transform: `translateY(${translateY}px) rotate(${rotate}deg)` }}
                      >
                        <Card
                          {...card}
                          layoutId={card.id}
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
                  {/* мини-веер рубашек наполовину под аватаркой */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none">
                    {Array(Math.min(3, p.hand.length)).fill(null).map((_,n)=> (
                      <div key={`back-${n}`} className="inline-block w-6 h-8 rounded bg-primary/40 border border-white/20 shadow-md -mx-1 rotate-[{-10 + n*10}]"></div>
                    ))}
                  </div>
                  {Array(p.hand.length)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="absolute will-change-transform"
                        style={{ left: i * 6, transform: `rotate(${i % 2 ? 3 : -3}deg)` }}
                      >
                        <Card isFaceUp={false} layoutId={`${p.socketId}-card-${i}`} />
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
    <div className="w-full h-full grid grid-rows-[auto_1fr_auto] grid-cols-3">
      <div className="col-span-3 flex justify-center gap-4 flex-wrap">
        {topPlayers.map((p) => renderPlayer(p))}
      </div>
      <div className="row-span-1 col-span-3 md:col-span-1 md:row-span-2 hidden md:flex flex-col justify-center items-start gap-4 flex-wrap">
        {leftPlayers.map((p) => renderPlayer(p))}
      </div>
      <div className="row-span-1 col-span-3 md:col-span-1 md:row-span-2 flex items-center justify-center">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex flex-col items-center w-24 relative">
            <div className="relative">
              {gameState.deck.length > 1 && (
                <>
                  <Card isFaceUp={false} className="absolute top-1 left-1 -rotate-6 shadow-md" />
                  <Card isFaceUp={false} className="absolute top-2 left-2 rotate-3 shadow-md" />
                  {gameState.deck.length > 2 && (
                    <Card isFaceUp={false} className="absolute top-3 left-3 rotate-[9deg] shadow-lg" />
                  )}
                </>
              )}
              <Card {...gameState.trumpCard} layoutId="trump" className="relative z-10" />
            </div>
            <p className="mt-2">{gameState.deck.length} карт</p>
          </div>
          <div className="flex items-center justify-center gap-4 min-w-[300px] flex-wrap">
            <AnimatePresence>
              {gameState.table.map((pair) => (
                <motion.div
                  key={pair.attack.id}
                  className="relative w-20 h-28"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  layout
                >
                  <Card {...pair.attack} layoutId={pair.attack.id} className="relative z-0" />
                  {pair.defense && (
                    <Card
                      {...pair.defense}
                      layoutId={pair.defense.id}
                      className="absolute left-12 top-9 rotate-[22deg] z-10 card-on-top"
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="row-span-1 col-span-3 md:col-span-1 md:row-span-2 hidden md:flex flex-col justify-center items-end gap-4 flex-wrap">
        {rightPlayers.map((p) => renderPlayer(p))}
      </div>
      <div className="col-span-3 flex justify-center gap-4 flex-wrap mt-4">
        {renderPlayer(myPlayer, true)}
      </div>
      <div className="md:hidden flex overflow-x-auto gap-4 mt-2 px-2 col-span-3">
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
