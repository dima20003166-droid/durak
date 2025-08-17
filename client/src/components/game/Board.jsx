import React from "react";

export default function Board({
  tableCards = [],
  trump = null,
  deckCount = 24,
  discardCount = 0,
}) {
  return (
    <div className="relative w-full max-w-5xl mx-auto">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-sm">
        {tableCards.length === 0 ? (
          <div className="col-span-2 flex items-center justify-center h-40 sm:h-56 opacity-75">
            <span className="text-sm sm:text-base">Ходы ещё не начались</span>
          </div>
        ) : (
          tableCards.map((pair, i) => (
            <div key={i} className="flex items-center gap-3">
              <CardFace label={cardToLabel(pair.attack)} />
              {pair.defense ? (
                <CardFace label={cardToLabel(pair.defense)} muted />
              ) : (
                <span className="text-xs opacity-70">—</span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-4 sm:gap-6">
        <div className="flex items-center gap-3 rounded-xl bg-black/20 border border-white/10 p-3">
          <DeckStack count={deckCount} />
          <div className="text-sm">
            <div className="opacity-70">Колода</div>
            <div className="font-medium">{deckCount} карт</div>
            {trump && (
              <div className="text-xs opacity-70 mt-1">
                Козырь: {typeof trump === "string" ? trump : trump?.suit}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-black/20 border border-white/10 p-3 justify-end">
          <div className="text-sm text-right">
            <div className="opacity-70">Сброс</div>
            <div className="font-medium">{discardCount} карт</div>
          </div>
          <DiscardStack count={discardCount} />
        </div>
      </div>
    </div>
  );
}

function CardFace({ label, muted = false }) {
  return (
    <div
      className={`h-12 w-8 sm:h-16 sm:w-12 rounded-lg border flex items-center justify-center
      ${muted ? "bg-white/10 border-white/15" : "bg-white/20 border-white/25"} select-none`}
      title={label}
    >
      <span className="text-xs sm:text-sm">{label}</span>
    </div>
  );
}

function DeckStack({ count = 0 }) {
  return (
    <div className="relative h-12 w-10 sm:h-16 sm:w-12">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-md border border-white/20 bg-gradient-to-br from-white/10 to-white/5"
          style={{ transform: `translate(${i * 2}px, ${-i * 2}px) rotate(${i}deg)` }}
        />
      ))}
      <span className="absolute -right-2 -top-2 text-[10px] sm:text-xs bg-white/10 px-1.5 py-0.5 rounded">
        {count}
      </span>
    </div>
  );
}

function DiscardStack({ count = 0 }) {
  return (
    <div className="relative h-12 w-10 sm:h-16 sm:w-12">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-md border border-white/15 bg-gradient-to-br from-red-400/10 to-orange-400/10"
          style={{ transform: `translate(${i * 2}px, ${-i * 2}px) rotate(${-i}deg)` }}
        />
      ))}
      <span className="absolute -left-2 -top-2 text-[10px] sm:text-xs bg-white/10 px-1.5 py-0.5 rounded">
        {count}
      </span>
    </div>
  );
}

function cardToLabel(card) {
  if (!card) return "";
  if (typeof card === "string") return card;
  const { rank, suit } = card;
  return `${rank ?? ""}${suit ?? ""}`;
}