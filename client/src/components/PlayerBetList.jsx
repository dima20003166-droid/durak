import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function PlayerBetList({ bets, textColor, align = 'left' }) {
  return (
    <ul
      className={`p-3 overflow-y-auto h-56 space-y-1 ${textColor} ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <AnimatePresence initial={false}>
        {bets.map((b) => (
          <motion.li
            key={b.id}
            initial={{ opacity: 0, x: align === 'right' ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: align === 'right' ? -10 : 10 }}
            transition={{ duration: 0.2 }}
            className={`flex justify-between px-2 py-1 rounded hover:bg-white/5 ${align === 'right' ? 'flex-row-reverse' : ''}`}
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
