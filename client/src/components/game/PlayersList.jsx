/* eslint-disable react/prop-types */
import React from 'react';
import { motion } from 'framer-motion';
import Card from '../Card';
import resolveAvatarUrl from '../../utils/resolveAvatarUrl';
import TableCenter from './TableCenter';
import useCardSize from '../../utils/useCardSize';

const PlayersList = ({
  room,
  mySocketId,
  myPlayer,
  gameState,
  selectedCard,
  setSelectedCard,
  openProfile,
}) => {
  const { width: cardW } = useCardSize();
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

    if (isMine) {
      return (
        <div
          key={p.socketId}
          className="flex flex-col items-center p-2 mb-2 basis-1/4 md:basis-1/6"
        >
          <div className="relative flex justify-center items-start h-28 w-full mt-1 pt-16">
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-sm md:text-base font-semibold"
            >
              <p
                className="truncate cursor-pointer"
                onClick={() => openProfile(p)}
              >
                {p.username}
              </p>
              <div
                className={`rounded-[10px] px-[10px] py-[6px] whitespace-nowrap ${
                  isCurrentAttacker ? 'bg-danger' : ''
                } ${isCurrentDefender ? 'bg-accent' : ''}`}
              >
                {statusText}
              </div>
            </div>
            {(() => {
              const hand = myPlayer.hand;
              const mid = (hand.length - 1) / 2;
              const width = cardW - 4 + hand.length * 24;
              return (
                <div className="relative" style={{ width }}>
                  {hand.map((card, i) => {
                    const offset = i * 24;
                    const rotate = (i - mid) * 8;
                    const translateY = Math.abs(i - mid) * -6;
                    return (
                      <motion.div
                        key={card.id}
                        className="absolute"
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
            })()}
          </div>
        </div>
      );
    }

    const width = cardW + (p.hand.length - 1) * 4;
    return (
      <div
        key={p.socketId}
        className="flex flex-col items-center p-2 mb-2 basis-1/4 md:basis-1/6"
      >
        <div
          className={`mb-1 text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
            isCurrentAttacker ? 'bg-danger' : ''
          } ${isCurrentDefender ? 'bg-accent' : ''}`}
        >
          {statusText}
        </div>
        <div className="opponentZone relative flex flex-col items-center pb-40">
          <img
            className="opAvatar w-16 h-16 rounded-full object-cover cursor-pointer"
            src={resolveAvatarUrl(
              p.avatarUrl,
              `https://placehold.co/64x64/1f2937/ffffff?text=${p.username.charAt(0)}`
            )}
            onClick={() => openProfile(p)}
            alt=""
          />
          <div
            className="opHand stacked"
            style={{
              position: 'absolute',
              left: '50%',
              top: 'calc(100% + 48px)',
              transform: 'translateX(-50%)',
              width,
            }}
          >
            {Array(p.hand.length)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    transform: `translateX(${i * 4}px) translateY(${-i * 8}px)`,
                    zIndex: i,
                  }}
                >
                  <Card
                    isFaceUp={false}
                    layoutId={`${p.socketId}-card-${i}`}
                    style={{ boxShadow: '0 8px 24px rgba(0,0,0,.35)' }}
                  />
                </div>
              ))}
          </div>
        </div>
        <p
          className="font-semibold mt-1 truncate cursor-pointer w-full text-center"
          onClick={() => openProfile(p)}
        >
          {p.username}
        </p>
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
                  <Card isFaceUp={false} className="absolute top-1 left-1 -rotate-6" />
                  <Card isFaceUp={false} className="absolute top-2 left-2 rotate-3" />
                </>
              )}
              <Card {...gameState.trumpCard} layoutId="trump" className="relative z-10" />
            </div>
            <p className="mt-2">{gameState.deck.length} карт</p>
          </div>
          <TableCenter table={gameState.table} />
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
