import React from 'react';
import PropTypes from 'prop-types';
import Button from '../Button';

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
    <div className="flex flex-col md:flex-row items-center w-full gap-y-2 md:gap-x-4 p-4">
      <div className="flex justify-center gap-x-4 flex-1">
        {(isAttacker || canThrowIn) && (
          <Button
            onClick={() => onAction('attack')}
            disabled={!selectedCard || actionBusy}
            className="px-6 py-3 font-semibold"
            variant="primary"
          >
            Ходить/Подкинуть
          </Button>
        )}
        {isDefender && (
          <Button
            onClick={() => onAction('defend')}
            disabled={!selectedCard || actionBusy || !gameState.table.some((p) => !p.defense)}
            className="px-6 py-3 font-semibold"
            variant="primary"
          >
            Отбиться
          </Button>
        )}
        {(isAttacker || canThrowIn) && (
          <Button
            onClick={() => onAction('pass')}
            disabled={
              actionBusy ||
              gameState.table.length === 0 ||
              !gameState.table.every((p) => p.defense)
            }
            className="px-6 py-3 font-semibold"
            variant="accent"
          >
            Бито
          </Button>
        )}
        {isDefender && (
          <Button
            onClick={() => onAction('take')}
            disabled={actionBusy || gameState.table.length === 0}
            className="px-6 py-3 font-semibold"
            variant="danger"
          >
            Беру
          </Button>
        )}
      </div>
      <div className="md:ml-auto ml-0">
        <Button
          onClick={onSurrender}
          disabled={!canSurrender}
          className="px-6 py-3 font-semibold"
          variant="default"
          title="Признать поражение и завершить игру"
        >
          Сдаться
        </Button>
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
