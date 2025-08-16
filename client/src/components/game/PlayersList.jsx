import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  isOpen = true,
}) => {
  const myIdx = room.players.findIndex((x) => x.socketId === mySocketId);
  const orderedPlayers =
    myIdx >= 0
      ? [...room.players.slice(myIdx), ...room.players.slice(0, myIdx)]
      : room.players;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 80, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col w-full h-full mt-2"
        >
          <div className="grid flex-grow grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
            <AnimatePresence>
              {orderedPlayers.map((p, index) => {
            const isCurrentAttacker = index === gameState.attackerIndex;
            const isCurrentDefender = index === gameState.defenderIndex;

            return (
              <motion.div
                key={p.socketId}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center glass-surface rounded p-2"
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
                  {p.socketId === mySocketId ? (
                    <div className="flex">
                      {myPlayer.hand.map((card, i) => (
                        <div key={card.id} style={{ marginLeft: i ? -30 : 0 }}>
                          <Card
                            {...card}
                            isSelected={selectedCard?.id === card.id}
                            onClick={() => setSelectedCard(card)}
                            initial="deal"
                            animate="idle"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex">
                      {Array(p.hand.length)
                        .fill(0)
                        .map((_, i) => (
                          <div key={i} style={{ marginLeft: i ? -12 : 0 }}>
                            <Card isFaceUp={false} initial="deal" animate="idle" />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-4 py-4 glass-surface rounded-lg">
            <div className="flex flex-col items-center w-24">
              <Card {...gameState.trumpCard} initial="deal" animate="idle" />
              <p className="mt-2">{gameState.deck.length} карт</p>
            </div>
            <div className="flex items-center justify-center gap-4 min-w-[300px]">
              {gameState.table.map((pair, i) => (
                <div key={i} className="relative w-20 h-28">
                  <Card {...pair.attack} initial="deal" animate="idle" />
                  {pair.defense && (
                    <Card
                      {...pair.defense}
                      className="translate-x-2 translate-y-2"
                      initial="deal"
                      animate="idle"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlayersList;
