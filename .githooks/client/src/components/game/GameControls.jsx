// client/src/components/game/GameControls.jsx
import React from "react";

/**
 * Универсальная панель действий для стола «Дурак».
 * НИЧЕГО не знает о твоей бизнес-логике — просто вызывает onAction(actionName).
 *
 * Ожидаемые (необязательные) пропсы:
 * - game: объект состояния. Можно передавать флаги доступности:
 *   game.canTake, game.canBeat, game.canEndTurn, game.canThrowIn
 *   (если их нет — кнопки будут активны по умолчанию)
 * - me: текущий игрок (необязательно)
 * - onAction: (action: string) => void
 */
export default function GameControls({ game, me, onAction }) {
  const canTake = game?.canTake ?? true;
  const canBeat = game?.canBeat ?? true;
  const canEndTurn = game?.canEndTurn ?? true;
  const canThrowIn = game?.canThrowIn ?? true;

  const handle = (action) => {
    if (typeof onAction === "function") {
      onAction(action);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => handle("take")}
          disabled={!canTake}
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed border border-white/15 transition"
          title="Взять карты"
        >
          Взять
        </button>

        <button
          type="button"
          onClick={() => handle("beat")}
          disabled={!canBeat}
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed border border-white/15 transition"
          title="Отбить (бито)"
        >
          Бито
        </button>

        <button
          type="button"
          onClick={() => handle("endTurn")}
          disabled={!canEndTurn}
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed border border-white/15 transition"
          title="Закончить ход"
        >
          Закончить ход
        </button>

        <button
          type="button"
          onClick={() => handle("throwIn")}
          disabled={!canThrowIn}
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed border border-white/15 transition"
          title="Подбросить карту"
        >
          Подбросить
        </button>

        {/* Информер справа (опционально) */}
        <div className="ml-auto text-xs sm:text-sm text-white/60">
          {game?.turnPlayerName ? `Ход: ${game.turnPlayerName}` : null}
        </div>
      </div>
    </div>
  );
}
