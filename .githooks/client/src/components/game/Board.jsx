import React from 'react';
import Card from '../Card';

const Board = ({ room, mySocketId, myPlayer, gameState }) => {
  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-surface p-6 rounded-xl border border-border text-center w-full max-w-md">
          <p className="text-muted">Загрузка стола…</p>
        </div>
      </div>
    );
  }

  const pairs = Array.isArray(gameState.table) ? gameState.table : [];
  const deckCount = Array.isArray(gameState.deck) ? gameState.deck.length : (gameState.deckCount ?? 0);
  const trump = gameState.trumpCard;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {/* Top indicators */}
      <div className="flex items-center justify-center gap-4 mb-3">
        <div className="px-3 py-1 rounded-full text-xs bg-bg/60 border border-border">
          Колода: <b>{deckCount}</b>
        </div>
        {trump && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-bg/60 border border-border">
            Козырь:
            <Card {...trump} size="sm" />
          </div>
        )}
        <div className="px-3 py-1 rounded-full text-xs bg-bg/60 border border-border">
          Бито: <b>{Array.isArray(gameState.discardPile) ? gameState.discardPile.length : 0}</b>
        </div>
      </div>

      {/* Battlefield */}
      <div className="durak-battlefield table-glass glow-ring p-4 md:p-6 rounded-2xl border border-border/60 bg-surface/60 w-full max-w-3xl overflow-hidden">
        {pairs.length === 0 ? (
          <div className="text-center text-muted py-10">На столе нет карт</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 place-items-center">
            {pairs.map((pair, idx) => (
              <div key={idx} className="relative w-[112px] h-[156px]">
                {/* attack */}
                {pair.attack && (
                  <div className="absolute top-0 left-0">
                    <Card {...pair.attack} size="lg" from="table" />
                  </div>
                )}
                {/* defense */}
                {pair.defense && (
                  <div className="absolute top-2 left-6 rotate-12">
                    <Card {...pair.defense} size="lg" from="table" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Board;
