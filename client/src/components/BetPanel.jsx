import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { TrophyIcon, WalletIcon } from './icons';
import socketService from '../services/socketService';

function NeonButton({ color, disabled, onClick, Icon, children }) {
  const gradients = {
    red: 'from-[var(--jackpot-red)] to-[#ff6b6b]',
    orange: 'from-[var(--jackpot-orange)] to-[#ffb347]',
  };
  const gradient = disabled ? 'from-gray-500 to-gray-600' : gradients[color];
  const base = [
    'flex items-center justify-center gap-2 px-4 py-2 rounded font-neon text-white',
    'w-full md:w-auto transition-all duration-300 bg-gradient-to-r',
  ].join(' ');
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${gradient} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
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
    socketService.placeWheelBet(color, amount, clientBetId, (res) => {
      if (res?.ok && res.balance != null) {
        const handlers = socketService.handlers.get('current_user_update');
        if (handlers) {
          for (const h of handlers) h({ balance: res.balance });
        }
      }
    });
  };
  const multiply = () => setAmount((a) => Number(a) * 2);
  const divide = () => setAmount((a) => Math.max(1, Math.floor(Number(a) / 2)));
  const add10 = () => setAmount((a) => Number(a) + 10);
  const add50 = () => setAmount((a) => Number(a) + 50);
  const add150 = () => setAmount((a) => Number(a) + 150);
  const inputClasses = [
    'w-full md:w-32 text-center bg-bg border border-border rounded',
    'transition-all duration-300 focus:outline-none',
  ].join(' ');
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-wrap md:flex-nowrap items-center gap-2 justify-center p-2 border-b border-divider"
    >
      <div className="flex items-center gap-2 w-full md:w-auto flex-wrap md:flex-nowrap">
        <motion.input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
          className={inputClasses}
          whileFocus={{ scale: 1.02, boxShadow: '0 0 8px var(--jackpot-red)' }}
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={multiply}
          className="px-3 py-2 rounded bg-gradient-to-r from-gray-600 to-gray-700 text-white transition-all duration-300"
        >
          ×2
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={divide}
          className="px-3 py-2 rounded bg-gradient-to-r from-gray-600 to-gray-700 text-white transition-all duration-300"
        >
          /2
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={add10}
          className="px-3 py-2 rounded bg-gradient-to-r from-gray-600 to-gray-700 text-white transition-all duration-300"
        >
          +10
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={add50}
          className="px-3 py-2 rounded bg-gradient-to-r from-gray-600 to-gray-700 text-white transition-all duration-300"
        >
          +50
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={add150}
          className="px-3 py-2 rounded bg-gradient-to-r from-gray-600 to-gray-700 text-white transition-all duration-300"
        >
          +150
        </motion.button>
      </div>
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
    </motion.div>
  );
}

BetPanel.propTypes = {
  state: PropTypes.string.isRequired,
};
