import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { TrophyIcon, WalletIcon } from './icons';
import socketService from '../services/socketService';

function NeonButton({ color, disabled, onClick, Icon, children }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: `0 0 15px var(--jackpot-${color})` }}
      whileTap={{ scale: 0.95 }}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded border-2 font-neon text-white ${disabled ? 'opacity-50' : ''}`}
      style={{
        borderColor: `var(--jackpot-${color})`,
        boxShadow: `0 0 10px var(--jackpot-${color})`,
        color: `var(--jackpot-${color})`,
      }}
    >
      <Icon />
      {children}
    </motion.button>
  );
}

NeonButton.propTypes = {
  color: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  Icon: PropTypes.elementType,
  children: PropTypes.node.isRequired,
};

NeonButton.defaultProps = {
  disabled: false,
  onClick: undefined,
  Icon: () => null,
};

export default function BetPanel({ state }) {
  const [amount, setAmount] = useState(1);
  const place = (color) => {
    const clientBetId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    socketService.placeWheelBet(color, amount, clientBetId);
  };
  return (
    <div className="space-y-2">
      <input
        type="number"
        min="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-32 text-center bg-bg border border-border rounded"
      />
      <div className="flex gap-4 justify-center">
        <NeonButton
          color="red"
          disabled={state !== 'OPEN'}
          onClick={() => place('red')}
          Icon={TrophyIcon}
        >
          Red
        </NeonButton>
        <NeonButton
          color="orange"
          disabled={state !== 'OPEN'}
          onClick={() => place('orange')}
          Icon={WalletIcon}
        >
          Orange
        </NeonButton>
      </div>
    </div>
  );
}

BetPanel.propTypes = {
  state: PropTypes.string.isRequired,
};
