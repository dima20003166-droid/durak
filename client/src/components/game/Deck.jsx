import React from 'react';
import PropTypes from 'prop-types';
import Card from '../Card';
import useCardSize from '../../utils/useCardSize';
import './Deck.css';

export default function Deck({ remaining = 0, trumpCard }) {
  const { width, height } = useCardSize();

  return (
    <div className="flex items-end gap-4">
      <div className="deck" data-count={remaining} style={{ width, height }}>
        <span className="deck-count">{remaining}</span>
      </div>
      {trumpCard && <Card {...trumpCard} layoutId="trump" className="relative" />}
    </div>
  );
}

Deck.propTypes = {
  remaining: PropTypes.number.isRequired,
  trumpCard: PropTypes.object.isRequired,
};
