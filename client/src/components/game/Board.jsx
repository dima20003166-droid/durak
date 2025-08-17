import React from 'react';

function DeckStack({ count = 24 }) {
  const layers = Math.min(Math.max(count - 1, 0), 4); // до 4 «подложек»
  return (
    <div className="relative h-[min(24vw,240px)] w-[min(18vw,180px)]">
      {Array.from({ length: layers }).map((_, i) => (
        <div
          key={i}
          className="absolute left-0 top-0 h-[72%] w-[72%] rounded bg-[url('/assets/card-back.svg')] bg-cover bg-center shadow-sm"
          style={{ transform: `translate(${i * 4}px, ${i * 3}px) rotate(${i * 1.5}deg)` }}
        />
      ))}
      {/* Верхняя, рабочая карта */}
      <div className="absolute left-0 top-0 h-[72%] w-[72%] rounded bg-[url('/assets/card-back.svg')] bg-cover bg-center shadow-lg" />
    </div>
  );
}

function Pair({ attackCard, defendCard }) {
  return (
    <div className="relative w-[min(18vw,180px)] h-[min(24vw,240px)] pair-overlap-50">
      {attackCard && (
        <img
          src={attackCard.img}
          className="attack absolute left-0 top-0 w-[72%] shadow-md rounded"
          style={{ transform: 'rotate(-6deg)' }}
        />
      )}
      {defendCard && (
        <img
          src={defendCard.img}
          className="defend absolute left-1/2 top-1/2 w-[72%] shadow-lg rounded"
          style={{ transform: 'translate(-45%,-55%) rotate(10deg)' }}
        />
      )}
    </div>
  );
}

// Универсальная доска: принимает пропсы; без пропсов показывает пустой стол/демо
export default function Board({ pairs = [], deckCount = 24, trump }) {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Бита */}
      {pairs.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {pairs.map((p, idx) => (
            <Pair key={idx} attackCard={p.attack} defendCard={p.defend} />
          ))}
        </div>
      ) : (
        <div className="text-white/50 text-sm">Ходів у «біті» поки немає</div>
      )}

      {/* Колода і козырь */}
      <div className="flex items-end gap-6">
        <DeckStack count={deckCount} />
        {trump?.img ? (
          <img src={trump.img} className="h-[min(24vw,240px)] w-auto rotate-12 drop-shadow" />
        ) : null}
      </div>
    </div>
  );
}
