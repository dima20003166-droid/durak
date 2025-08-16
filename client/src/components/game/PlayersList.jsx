import React from 'react';
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
    return (
      <div
        key={p.socketId}
        className="flex flex-col items-center bg-surface rounded p-2 mb-2 basis-1/4 md:basis-1/6"
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
            <div className="flex">
              {myPlayer.hand.map((card, i) => (
                <div key={card.id} className={i ? '-ml-card-overlap-md' : ''}>
                  <Card
                    {...card}
                    isSelected={selectedCard?.id === card.id}
                    onClick={() => setSelectedCard(card)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex">
              {Array(p.hand.length)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className={i ? '-ml-card-overlap-sm' : ''}>
                    <Card isFaceUp={false} />
                  </div>
                ))}
            </div>
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
                  <Card {...pair.attack} />
                  {pair.defense && (
                    <Card {...pair.defense} className="translate-x-2 translate-y-2" />
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
      <div className="flex md:hidden justify-center gap-4 flex-wrap mt-2">
        {leftPlayers.concat(rightPlayers).map((p) => renderPlayer(p))}
      </div>
    </div>
  );
};

export default PlayersList;
