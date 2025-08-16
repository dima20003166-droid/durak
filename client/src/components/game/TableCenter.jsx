import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../Card';
import './TableCenter.css';
import useCardSize from '../../utils/useCardSize';

export default function TableCenter({ table = [] }) {
  const { width: cardW, height: cardH } = useCardSize();
  const width = cardW + (table.length - 1) * 22 + 10;
  const height = cardH + (table.length - 1) * 10 + 12;

  return (
    <div className="table-center min-w-[300px]" style={{ width, height }}>
      <AnimatePresence>
        {table.map((pair, idx) => (
          <motion.div
            key={pair.attack.id}
            className="pair-container"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            layout
            style={{ transform: `translate(${idx * 22}px, ${idx * 10}px)`, width: cardW, height: cardH }}
          >
            <Card
              {...pair.attack}
              layoutId={pair.attack.id}
              className="attack-card relative z-0 pointer-events-auto"
            />
            {pair.defense && (
              <Card
                {...pair.defense}
                layoutId={pair.defense.id}
                className="defense-card absolute left-0 top-0 pointer-events-auto z-10"
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

TableCenter.propTypes = {
  table: PropTypes.arrayOf(
    PropTypes.shape({
      attack: PropTypes.object.isRequired,
      defense: PropTypes.object,
    })
  ),
};
