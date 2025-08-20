import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../Card';
import TableCardPair from './TableCardPair';
import Button from '../Button';
import resolveAvatarUrl from '../../utils/resolveAvatarUrl';

const PlayersList = ({
  room,
  mySocketId,
  myPlayer,
  gameState,
  selectedCard,
  setSelectedCard,
  openProfile,
  onAction,
  isAttacker,
  isDefender,
  canThrowIn,
  actionBusy,
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

  const tablePairs = gameState.table.map((pair, i) => ({
    ...pair,
    slotIndex: pair.slotIndex ?? i,
  }));

  // === layout/density tuning ===
  const attackCount = (gameState?.table ?? []).reduce((n, p) => n + (p?.attack ? 1 : 0), 0);

  function getTableLayout(pairs) {
    const totalCards = (pairs ?? []).reduce(
      (n, p) => n + (p?.attack ? 1 : 0) + (p?.defense ? 1 : 0),
      0
    );
    if (totalCards <= 4)  return { cardW: 100, cardH: 150, overlap: 0.58, step: 60, maxPerRow: 6 };
    if (totalCards <= 8)  return { cardW: 92,  cardH: 138, overlap: 0.62, step: 54, maxPerRow: 7 };
    if (totalCards <= 12) return { cardW: 84,  cardH: 126, overlap: 0.64, step: 48, maxPerRow: 8 };
    return { cardW: 78, cardH: 117, overlap: 0.66, step: 44, maxPerRow: 9 };
  }

  const layout = getTableLayout(tablePairs);
  const { cardW, cardH, overlap: pairOverlap, step, maxPerRow } = layout;


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
            
            <div className="mt-1 w-full flex items-center justify-center gap-2 flex-wrap">
              {/* Compact action controls in place of my nickname */}
                {isAttacker && (
                  <>
                    <Button
                      onClick={() => onAction('attack')}
                      disabled={actionBusy || !selectedCard}
                      className="px-3 py-1.5 text-sm md:text-base font-semibold"
                      variant="primary"
                    >
                      {canThrowIn ? 'Подкинуть' : 'Атакую'}
                    </Button>
                    <Button
                      onClick={() => onAction('bito')}
                      disabled={actionBusy || (gameState?.table?.length ?? 0) === 0}
                      className="px-3 py-1.5 text-sm md:text-base font-semibold"
                      variant="success"
                    >
                      Бито
                    </Button>
                  </>
                )}
              {isDefender && (
                <>
                  <Button
                    onClick={() => onAction('defend')}
                    disabled={actionBusy || !selectedCard || (gameState?.table?.length ?? 0) === 0}
                    className="px-3 py-1.5 text-sm md:text-base font-semibold"
                    variant="primary"
                  >
                    Бью
                  </Button>
                  <Button
                    onClick={() => onAction('take')}
                    disabled={actionBusy || (gameState?.table?.length ?? 0) === 0}
                    className="px-3 py-1.5 text-sm md:text-base font-semibold"
                    variant="danger"
                  >
                    Беру
                  </Button>
                </>
              )}
            </div>
    
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
              className="w-16 h-16 rounded-full object-cover cursor-pointer relative z-10 -mb-3"
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
            })()
          ) : (
            
(() => {
              // Compact opponent hand under avatar (v3):
              // - No badge; the fan shows the exact number of cards
              // - Multi-row layout when cards > maxPerRow
              const total = p.hand.length || 0;
              const cardW = 22;
              const cardH = 34;
              const maxPerRow = total <= 10 ? 10 : 12;
              const stepX = Math.max(4, Math.floor(cardW * 0.45)); // overlap horizontally
              const stepY = Math.max(6, Math.floor(cardH * 0.55)); // distance between rows
              const rows = Math.max(1, Math.ceil(total / maxPerRow));
              const cols = Math.min(total, maxPerRow);
              const fanWidth = (cols - 1) * stepX + cardW;

              return (
                <div className="relative h-16 w-full flex items-start justify-center -mt-1">
                  {/* Fan of card backs under the avatar. Lower z to avoid covering nickname. */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-0"
                    style={{ width: fanWidth, height: rows * stepY, top: -(cardH * 1.15) }}
                  >
                    {Array.from({ length: total }).map((_, i) => {
                      const row = Math.floor(i / maxPerRow);
                      const col = i % maxPerRow;
                      const x = col * stepX;
                      const rot = -6 + (col / Math.max(1, maxPerRow - 1)) * 12; // slight fan
                      const y = row * stepY; // stack rows downward (but whole block is lifted up)
                      return (
                        <div
                          key={i}
                          className="absolute rounded border border-white/20 shadow"
                          style={{
                            left: x,
                            top: y,
                            width: cardW,
                            height: cardH,
                            transform: `rotate(${rot}deg)`,
                            background: 'var(--color-primary, #334155)',
                            opacity: 0.95,
                          }}
                        />
                      );
                    })}
                  </div>
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
      <div className="row-span-1 col-span-3 md:col-span-1 hidden md:flex flex-col justify-center items-start gap-4 flex-wrap">
        {leftPlayers.map((p) => renderPlayer(p))}
      </div>
      <div className="row-span-1 col-span-3 md:col-span-1 flex items-center justify-center">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex flex-col items-center w-24 relative">
             <div className="relative w-card-md h-card-md flex items-center justify-center">
                {/* Козырь лежит повернутым */}
                {attackCount < 4 && (
                <div className="absolute rotate-90 -translate-x-2 z-0">
                    <Card {...gameState.trumpCard} layoutId="trump" />
                </div>
                )}
                {/* Стопка карт лежит сверху */}
                {gameState.deck.length > 0 && attackCount < 4 && (
                <div className="absolute translate-x-2 z-10">
                    <Card isFaceUp={false} />
                </div>
                )}
            </div>
            <p className="mt-2">{gameState.deck.length} карт</p>
          </div>
          <div
            className="relative min-w-[300px]"
            style={{ height: 'var(--card-h)', width: `calc(${tablePairs.length} * (var(--card-w) + 1rem))` }}
          >
            <AnimatePresence>
              {tablePairs.map((pair) => (
                <motion.div
                  key={pair.attack.id}
                  className="absolute"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  layout
                  style={{
                    top: 0,
                    left: `${(pair.slotIndex ?? 0) * step}px`,
                    width: `${cardW}px`,
                    height: `${cardH}px`,
                  }}
                >
                  <TableCardPair attack={pair.attack} defense={pair.defense} dir={pair.dir} overlap={pairOverlap} cardW={cardW} cardH={cardH} seed={pair.id ?? `${pair.attack?.code}-${pair.defense?.code ?? ''}`} slotIndex={pair.slotIndex ?? i} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="row-span-1 col-span-3 md:col-span-1 hidden md:flex flex-col justify-center items-end gap-4 flex-wrap">
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
