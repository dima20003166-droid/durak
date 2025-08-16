import React from 'react';
import { motion } from 'framer-motion';

export default function JackpotWheel({ state, winner }) {
  const rotation = state === 'SPIN' ? 720 : 0;
  return (
    <motion.div
      className="w-48 h-48 rounded-full border-8 border-primary flex items-center justify-center"
      animate={{ rotate: rotation }}
      transition={{ duration: 2 }}
    >
      {winner && <span className="text-xl font-bold">{winner}</span>}
    </motion.div>
  );
}
