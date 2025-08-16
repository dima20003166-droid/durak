import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function PlayerBetList({ bets, textColor }) {
  return (
    <ul className={`p-3 overflow-y-auto h-56 space-y-1 ${textColor}`}>
      <AnimatePresence initial={false}>
        {bets.map((b) => (
          <motion.li
            key={b.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex justify-between px-2 py-1 rounded hover:bg-white/5"
            layout
          >
            <span>{b.username}</span>
            <span>{b.amount}</span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
