import React from 'react';
import PropTypes from 'prop-types';

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
            className="px-6 py-3 font-semibold rounded-lg bg-primary hover:bg-primary/80 disabled:bg-border transition-all duration-300 hover:shadow-[0_0_10px_var(--neon-primary)]"
          >
            Ходить/Подкинуть
          </button>
        )}
        {isDefender && (
          <button
            onClick={() => onAction('defend')}
            disabled={!selectedCard || actionBusy || !gameState.table.some((p) => !p.defense)}
            className="px-6 py-3 font-semibold rounded-lg bg-primary hover:bg-primary/80 disabled:bg-border transition-all duration-300 hover:shadow-[0_0_10px_var(--neon-primary)]"
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
            className="px-6 py-3 font-semibold rounded-lg bg-accent hover:bg-accent/80 disabled:bg-border transition-all duration-300 hover:shadow-[0_0_10px_var(--neon-accent)]"
          >
            Бито
          </button>
        )}
        {isDefender && (
          <button
            onClick={() => onAction('take')}
            disabled={actionBusy || gameState.table.length === 0}
            className="px-6 py-3 font-semibold rounded-lg bg-danger hover:bg-danger/80 disabled:bg-border transition-all duration-300 hover:shadow-[0_0_10px_var(--neon-danger)]"
          >
            Беру
          </button>
        )}
      </div>
      <div className="ml-auto">
        <button
          onClick={onSurrender}
          disabled={!canSurrender}
          className="px-6 py-3 font-semibold rounded-lg bg-surface hover:bg-surface/80 disabled:bg-border transition-all duration-300 hover:shadow-[0_0_10px_var(--neon-primary)]"
          title="Признать поражение и завершить игру"
        >
          Сдаться
        </button>
      </div>
    </div>
  );
};

export default ActionPanel;

ActionPanel.propTypes = {
  isAttacker: PropTypes.bool,
  isDefender: PropTypes.bool,
  canThrowIn: PropTypes.bool,
  selectedCard: PropTypes.object,
  actionBusy: PropTypes.bool,
  gameState: PropTypes.object,
  onAction: PropTypes.func.isRequired,
  onSurrender: PropTypes.func.isRequired,
  canSurrender: PropTypes.bool,
};
