import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../Card';
import './TableCenter.css';
import useCardSize from '../../utils/useCardSize';

export default function TableCenter({ table = [] }) {
  const { width: cardW, height: cardH } = useCardSize();

  return (
    <div className="table-center flex flex-wrap justify-center items-center gap-4 min-w-[300px]">
      <AnimatePresence>
        {table.map((pair) => (
          <motion.div
            key={pair.attack.id}
            className="pair-container"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            layout
            style={{ width: cardW, height: cardH }}
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
