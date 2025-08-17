import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

export default function WinLossPopup({ amount }) {
  return (
    <AnimatePresence>
      {amount != null && (
        <motion.div
          key={amount}
          initial={{ scale: 0, opacity: 0, y: 0 }}
          animate={{ scale: 1, opacity: 1, y: -20 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 1.3, ease: 'easeOut' }}
          className={`absolute inset-0 flex items-center justify-center pointer-events-none text-4xl font-bold ${amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {amount >= 0 ? `+${amount.toFixed(2)}` : `-${Math.abs(amount).toFixed(2)}`}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

WinLossPopup.propTypes = {
  amount: PropTypes.number,
};

WinLossPopup.defaultProps = {
  amount: null,
};
