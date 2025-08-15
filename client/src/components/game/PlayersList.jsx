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

  return (
    <div className="relative flex-grow w-full h-full mt-2">
      {room.players.map((p, index) => {
        const relativeIndex = (index - myIdx + room.players.length) % room.players.length;
        const pos =
          relativeIndex === 0
            ? { bottom: '4%', left: '50%', transform: 'translateX(-50%)' }
            : (() => {
                const angle = (relativeIndex / (room.players.length - 1)) * Math.PI;
                const radiusX = 45,
                  radiusY = 40;
                const x = 50 - radiusX * Math.cos(angle);
                const y = 40 - radiusY * Math.sin(angle);
                return { top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)' };
              })();

        const isCurrentAttacker = index === gameState.attackerIndex;
        const isCurrentDefender = index === gameState.defenderIndex;

        return (
          <div key={p.socketId} className="absolute transition-all duration-500" style={pos}>
            <div className="relative flex flex-col items-center w-40">
              <div
                className={`absolute -top-6 px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${
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
              <p className="font-semibold mt-1 truncate cursor-pointer" onClick={() => openProfile(p)}>
                {p.username}
              </p>

              <div className="relative flex justify-center items-center h-28 w-full mt-2">
                {p.socketId === mySocketId
                  ? myPlayer.hand.map((card, i) => (
                      <div
                        key={card.id}
                        className="absolute"
                        style={{ transform: `translateX(${(i - myPlayer.hand.length / 2) * 25}px)` }}
                      >
                        <Card
                          {...card}
                          isSelected={selectedCard?.id === card.id}
                          onClick={() => setSelectedCard(card)}
                        />
                      </div>
                    ))
                  : Array(p.hand.length)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="absolute"
                          style={{ transform: `translateX(${(i - p.hand.length / 2) * 10}px)` }}
                        >
                          <Card isFaceUp={false} />
                        </div>
                      ))}
              </div>
            </div>
          </div>
        );
      })}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-4">
        <div className="flex flex-col items-center w-24">
          <Card {...gameState.trumpCard} />
          <p className="mt-2">{gameState.deck.length} карт</p>
        </div>
        <div className="flex items-center justify-center gap-4 min-w-[300px]">
          {gameState.table.map((pair, i) => (
            <div key={i} className="relative w-20 h-28">
              <Card {...pair.attack} />
              {pair.defense && <Card {...pair.defense} className="transform translate-x-2 translate-y-2" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayersList;
