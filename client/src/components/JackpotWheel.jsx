import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

function useWheel(bank) {
  return useMemo(() => {
    const total = bank.red + bank.orange;
    const redAngle = total ? (bank.red / total) * 360 : 180;
    const gradient = `conic-gradient(from -90deg, #ef4444 0deg ${redAngle}deg, #fb923c ${redAngle}deg 360deg)`;
    return { gradient, redAngle };
  }, [bank.red, bank.orange]);
}

export default function JackpotWheel({ state, winner, bank }) {
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
    <div className="relative w-72 sm:w-80 md:w-[360px] aspect-square mx-auto">
      <div className="absolute inset-0 rounded-full p-1 bg-[var(--neon-primary)]/30 shadow-[0_0_15px_var(--neon-primary)]">
        <div className="w-full h-full rounded-full" style={{ background: gradient }} />
        <div className="absolute inset-0 rounded-full pointer-events-none bg-white/10" />
      </div>
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full origin-bottom pointer-events-none"
        animate={{ rotate: rotation }}
        transition={transition}
      >
        <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white mx-auto drop-shadow-[0_0_6px_var(--neon-primary)]" />
        <div
          className="w-[2px] bg-white mx-auto drop-shadow-[0_0_6px_var(--neon-primary)]"
          style={{ height: 'calc(50% + 20px)' }}
        />
      </motion.div>
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
};

JackpotWheel.defaultProps = {
  winner: null,
};
