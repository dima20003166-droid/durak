import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

function useWheel(bank) {
  return useMemo(() => {
    const total = bank.red + bank.orange;
    const redAngle = total ? (bank.red / total) * 360 : 180;
    const gradient = `conic-gradient(from -90deg, #ef4444 0deg ${redAngle}deg, #fb923c ${redAngle}deg 360deg)`;
    return { gradient, redAngle };
  }, [bank.red, bank.orange]);
}

export default function JackpotWheel({ state, winner, bank, bets }) {
  const { gradient, redAngle } = useWheel(bank);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (state === 'SPIN') setRotation(720);
    if (state === 'OPEN') setRotation(0);
  }, [state]);

  useEffect(() => {
    if (state === 'SPIN' && winner) {
      const winAngle =
        winner === 'red' ? redAngle / 2 : redAngle + (360 - redAngle) / 2;
      setRotation(720 + winAngle);
    }
  }, [winner, state, redAngle]);

  const transition = {
    duration: winner && state === 'SPIN' ? 1 : 2,
    ease: winner && state === 'SPIN' ? 'easeOut' : 'linear',
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-64 h-64">
        <div
          className={`absolute inset-0 rounded-full border-8 border-primary shadow-[0_0_15px_rgba(255,255,255,0.5)] ${state === 'OPEN' ? 'animate-pulse' : ''}`}
          style={{ background: gradient }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full origin-bottom"
          animate={{ rotate: rotation }}
          transition={transition}
        >
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white mx-auto" />
          <div className="w-1 h-24 bg-white mx-auto" />
        </motion.div>
      </div>
      <div className="flex justify-between w-full max-w-sm text-xs">
        <motion.ul className="text-red-500 space-y-1">
          <AnimatePresence>
            {bets.red.map((b) => (
              <motion.li
                key={b.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {b.userId}: {b.amount}
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
        <motion.ul className="text-orange-500 text-right space-y-1">
          <AnimatePresence>
            {bets.orange.map((b) => (
              <motion.li
                key={b.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {b.userId}: {b.amount}
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </div>
  );
}

JackpotWheel.propTypes = {
  state: PropTypes.string.isRequired,
  winner: PropTypes.string,
  bank: PropTypes.shape({
    red: PropTypes.number,
    orange: PropTypes.number,
  }).isRequired,
  bets: PropTypes.shape({
    red: PropTypes.array,
    orange: PropTypes.array,
  }).isRequired,
};

JackpotWheel.defaultProps = {
  winner: null,
};
