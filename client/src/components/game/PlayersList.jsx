import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../Card';

/** Локальний фолбек для аватарки */
const avatarOf = (p) =>
  p?.avatarUrl ||
  (p?.username
    ? `https://placehold.co/56x56/1f2937/ffffff?text=${encodeURIComponent(p.username.charAt(0))}`
    : 'https://placehold.co/56x56/1f2937/ffffff?text=?');

/** Анімації поля битви і пар */
const battlefieldVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const pairVariants = {
  hidden: { opacity: 0, y: -16, scale: 0.96, rotate: -1.5 },
  show: {
    opacity: 1, y: 0, scale: 1, rotate: 0,
    transition: { type: 'spring', stiffness: 420, damping: 30, mass: 0.6 }
  },
  exit: { opacity: 0, y: 16, scale: 0.94, rotate: 1.5, transition: { duration: 0.18 } },
};

/**
 * Кути розміщення опонентів (°) для 1..5 суперників.
 * 0° — праворуч, 90° — зверху, 180° — зліва, 270° — внизу (тут моя рука).
 * Ми свідомо уникаємо сектору внизу, щоб не перекривати руку гравця.
 */
const SEAT_ANGLES = {
  1: [90],
  2: [60, 120],
  3: [50, 90, 130],
  4: [40, 90, 140, 180],
  5: [30, 70, 110, 150, 180],
};

const PlayersList = ({
  room,
  mySocketId,
  myPlayer,
  gameState,
  selectedCard,
  setSelectedCard,
  openProfile,
}) => {
  const players = room?.players || [];

  /** Вираховуємо список опонентів у стабільному порядку, починаючи з гравця після мене */
  const myIdx = Math.max(0, players.findIndex((x) => x.socketId === mySocketId));
  const orderedOpponents = [
    ...players.slice(myIdx + 1),
    ...players.slice(0, myIdx),
  ];

  /** Формуємо місця навколо столу (md+) */
  const oppCount = Math.min(5, Math.max(0, orderedOpponents.length));
  const seatAngles = SEAT_ANGLES[oppCount] || [];
  const seats = seatAngles.map((deg, i) => ({
    deg, player: orderedOpponents[i],
  }));

  /** Рендер опонента (аватар, нік, лічильник, міні-«віяло» рубашок) */
  const renderOpponent = (p) => {
    const isCurrentAttacker = gameState?.attackerId === p.id;
    const isCurrentDefender = gameState?.defenderId === p.id;
    const statusText = isCurrentAttacker ? 'Атака' : isCurrentDefender ? 'Захист' : '';
    const width = Math.max(60, Math.min(160, 16 + (p.hand?.length ?? 0) * 6));

    return (
      <div className="durak-seat flex flex-col items-center gap-2 px-2">
        {statusText && (
          <div
            className={`player-badge text-xs px-2 py-0.5 rounded-full ${isCurrentAttacker ? 'attacker' : ''} ${isCurrentDefender ? 'defender' : ''}`}
          >
            {statusText}
          </div>
        )}

        <img
          className="w-14 h-14 rounded-full object-cover cursor-pointer"
          src={avatarOf(p)}
          alt=""
          onClick={() => openProfile && openProfile(p)}
        />
        <p
          className="text-sm font-medium max-w-[120px] truncate cursor-pointer"
          onClick={() => openProfile && openProfile(p)}
          title={p.username}
        >
          {p.username}
        </p>

        <div className="relative mt-1" style={{ width }}>
          {/* міні-віяло рубашок */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none">
            {Array(Math.min(3, p.hand?.length ?? 0)).fill(null).map((_, n) => (
              <div key={`back-${n}`} className="mini-back inline-block -mx-1" style={{ transform: `rotate(${(-10 + n * 10)}deg)` }} />
            ))}
          </div>

          {/* бек-карти (кількість) */}
          {Array(p.hand?.length ?? 0).fill(0).map((_, i) => (
            <div key={i} className="absolute" style={{ left: i * 6, transform: `rotate(${i % 2 ? 2.5 : -2.5}deg)` }}>
              <Card isFaceUp={false} size="sm" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  /** Моя рука — інтерактивний «віял» */
  const renderMyHand = () => {
    const hand = myPlayer?.hand || [];
    const mid = (hand.length - 1) / 2;
    const angle = hand.length > 1 ? 12 / mid : 0;
    const spread = Math.min(36, hand.length * 12);

    return (
      <div className="relative h-[11.25rem] w-full max-w-[min(100%,860px)]">
        {hand.map((card, i) => {
          const rot = (i - mid) * angle;
          const dx = ((i - mid) / (mid || 1)) * spread;
          const isSel = selectedCard && selectedCard.id === card.id;
          return (
            <motion.div
              key={card.id}
              className="absolute left-1/2 -translate-x-1/2 origin-bottom"
              style={{ transform: `translateX(-50%) rotate(${rot}deg)` }}
              initial={false}
              animate={{ y: isSel ? -28 : 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.6 }}
            >
              <Card
                {...card}
                isFaceUp
                size="lg"
                layoutId={card.id}
                className="cursor-pointer"
                style={{ transform: `translateX(${dx}px)` }}
                isSelected={isSel}
                onClick={() => setSelectedCard && setSelectedCard(isSel ? null : card)}
              />
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="durak-table w-full h-full grid grid-rows-[auto_1fr_auto] grid-cols-1 md:grid-cols-3 gap-4">
      {/* === ЦЕНТРАЛЬНИЙ БЛОК (3 колонки на md+, одна колонка на мобільних) === */}
      <div className="row-span-1 col-span-1 md:col-span-3 relative">
        {/* Сітка із колодою/козирем, полем битви та відбоєм */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-[1]">
          {/* Колода + козир */}
          <div className="durak-panel table-glass px-4 py-3 rounded-2xl flex flex-col items-center justify-center gap-3">
            <div className="relative h-[9.125rem] w-[6.5rem]">
              <div className="deck-stack">
                <Card isFaceUp={false} size="lg" className="deck-card" />
                <Card isFaceUp={false} size="lg" className="deck-card" />
                <Card isFaceUp={false} size="lg" className="deck-card" />
              </div>
              {gameState?.trumpCard && (
                <div className="absolute z-10 left-10 top-8 rotate-[18deg]">
                  <Card {...gameState.trumpCard} layoutId="trump" size="lg" />
                </div>
              )}
            </div>
            <div className="text-sm text-muted">
              У колоді: <span className="font-semibold text-text">{gameState?.deck?.length ?? 0}</span>
            </div>
          </div>

          {/* Поле битви */}
          <motion.div
            className="durak-battlefield relative rounded-3xl table-surface table-glass px-3 py-4 overflow-hidden"
            variants={battlefieldVariants}
            initial="hidden"
            animate="show"
          >
            <div className="absolute inset-0 pointer-events-none glow-ring" />
            <div className="flex items-center justify-center gap-5 flex-wrap min-h-[9.5rem]">
              <AnimatePresence initial={false}>
                {(gameState?.table || []).map((pair) => (
                  <motion.div
                    key={pair.attack.id}
                    className="relative w-[6.5rem] h-[9.125rem]"
                    variants={pairVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    layout
                  >
                    <Card {...pair.attack} layoutId={pair.attack.id} size="lg" className="relative z-0" />
                    {pair.defense && (
                      <div className="absolute left-14 top-10 rotate-[22deg] z-10 card-on-top">
                        <Card {...pair.defense} layoutId={pair.defense.id} size="lg" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Відбій */}
          <div className="durak-panel table-glass px-4 py-3 rounded-2xl flex flex-col items-center justify-center">
            <div className="relative h-[9.125rem] w-[6.5rem]">
              <div className="discard-stack">
                <Card isFaceUp={false} size="lg" className="discard-card" />
                <Card isFaceUp={false} size="lg" className="discard-card" />
              </div>
            </div>
            <div className="text-sm text-muted mt-2">Відбій</div>
          </div>
        </div>

        {/* Радіальна посадка опонентів (md+) */}
        <div className="seating-layer hidden md:block z-[2]">
          {seats.map(({ deg, player }) => (
            <div key={player.socketId} className="seat" style={{ '--theta': `${deg}deg` }}>
              {renderOpponent(player)}
            </div>
          ))}
        </div>
      </div>

      {/* Низ: моя рука */}
      <div className="row-span-1 col-span-1 md:col-span-3 flex items-center justify-center">
        {renderMyHand()}
      </div>

      {/* Мобільний горизонтальний ряд опонентів (xs/sm) */}
      <div className="md:hidden col-span-1 flex overflow-x-auto gap-4 py-2 -mx-2 px-2">
        {orderedOpponents.map((p) => (
          <div key={p.socketId} className="flex-shrink-0">{renderOpponent(p)}</div>
        ))}
      </div>
    </div>
  );
};

export default PlayersList;
