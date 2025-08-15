import React from 'react';

const ActionPanel = ({
  isAttacker,
  isDefender,
  canThrowIn,
  selectedCard,
  actionBusy,
  gameState,
  onAction,
  onSurrender,
  canSurrender,
}) => {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="mx-auto flex items-center gap-4">
        {(isAttacker || canThrowIn) && (
          <button
            onClick={() => onAction('attack')}
            disabled={!selectedCard || actionBusy}
            className="px-6 py-3 font-semibold rounded-lg bg-primary hover:bg-primary/80 disabled:bg-border transition-colors"
          >
            Ходить/Подкинуть
          </button>
        )}
        {isDefender && (
          <button
            onClick={() => onAction('defend')}
            disabled={!selectedCard || actionBusy || !gameState.table.some((p) => !p.defense)}
            className="px-6 py-3 font-semibold rounded-lg bg-primary hover:bg-primary/80 disabled:bg-border transition-colors"
          >
            Отбиться
          </button>
        )}
        {(isAttacker || canThrowIn) && (
          <button
            onClick={() => onAction('pass')}
            disabled={
              actionBusy ||
              gameState.table.length === 0 ||
              !gameState.table.every((p) => p.defense)
            }
            className="px-6 py-3 font-semibold rounded-lg bg-accent hover:bg-accent/80 disabled:bg-border transition-colors"
          >
            Бито
          </button>
        )}
        {isDefender && (
          <button
            onClick={() => onAction('take')}
            disabled={actionBusy || gameState.table.length === 0}
            className="px-6 py-3 font-semibold rounded-lg bg-danger hover:bg-danger/80 disabled:bg-border transition-colors"
          >
            Беру
          </button>
        )}
      </div>
      <div className="ml-auto">
        <button
          onClick={onSurrender}
          disabled={!canSurrender}
          className="px-6 py-3 font-semibold rounded-lg bg-surface hover:bg-surface/80 disabled:bg-border"
          title="Признать поражение и завершить игру"
        >
          Сдаться
        </button>
      </div>
    </div>
  );
};

export default ActionPanel;
