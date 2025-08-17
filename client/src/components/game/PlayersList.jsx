/* eslint-disable react/prop-types */
import React from 'react';
import { motion } from 'framer-motion';
import Card from '../Card';
import resolveAvatarUrl from '../../utils/resolveAvatarUrl';
import TableCenter from './TableCenter';
import Deck from './Deck';


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

    if (isMine) {
      return (
        <div
          key={p.socketId}
          className="flex flex-col items-center p-2 mb-2 basis-1/4 md:basis-1/6"
        >
          <div className="flex flex-col items-center gap-1 text-sm md:text-base font-semibold mb-2">
            <p className="truncate cursor-pointer" onClick={() => openProfile(p)}>
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
          <div className="myHand flex justify-center flex-wrap gap-2">
            {myPlayer.hand.map((card) => (
              <motion.div key={card.id} layoutId={card.id}>
                <Card
                  {...card}
                  isSelected={selectedCard?.id === card.id}
                  onClick={() => setSelectedCard(card)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

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
        <div className="opponentZone flex flex-col items-center">
          <img
            className="opAvatar w-16 h-16 rounded-full object-cover cursor-pointer"
            src={resolveAvatarUrl(
              p.avatarUrl,
              `https://placehold.co/64x64/1f2937/ffffff?text=${p.username.charAt(0)}`
            )}
            onClick={() => openProfile(p)}
            alt=""
          />
          <div className="opHand flex gap-1 mt-2">
            {Array(p.hand.length)
              .fill(0)
              .map((_, i) => (
                <Card
                  key={i}
                  isFaceUp={false}
                  layoutId={`${p.socketId}-card-${i}`}
                  style={{ boxShadow: '0 8px 24px rgba(0,0,0,.35)' }}
                />
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
          <Deck remaining={gameState.deck.length} trumpCard={gameState.trumpCard} />
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
