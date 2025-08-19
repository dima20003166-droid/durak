import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Card from '../Card';

export default function TableCardPair({ attack, defense, dir = 'right', overlap = 0.5, cardW = 110, cardH = 160 }) {
  const ov = Math.min(Math.max(overlap, 0.45), 0.6);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const attackRot = useMemo(() => ({ right: 3, left: -3, down: 3, up: -3 })[dir] || 0, [dir]);
  const defenseRot = useMemo(() => ({ right: -7, left: 7, down: -7, up: 7 })[dir] || 0, [dir]);

  const defenseTransform = useMemo(() => {
    const sign = dir === 'right' || dir === 'down' ? 1 : -1;
    const shiftPx = (1 - ov) * (dir === 'right' || dir === 'left' ? cardW : cardH);
    return dir === 'right' || dir === 'left'
      ? `translateX(${sign * shiftPx}px) translateY(-6px) rotate(${defenseRot}deg)`
      : `translateY(${sign * shiftPx}px) rotate(${defenseRot}deg)`;
  }, [dir, ov, cardW, cardH, defenseRot]);

  const attackTransform = useMemo(() => `rotate(${attackRot}deg)`, [attackRot]);

  const transition = prefersReducedMotion ? 'none' : 'transform 220ms cubic-bezier(.18,.89,.32,1.28)';

  return (
    <div className="relative" style={{ width: `${cardW}px`, height: `${cardH}px`, willChange: 'transform' }}>
      <Card
        {...attack}
        className="absolute top-0 left-0 z-[1]"
        style={{ transform: attackTransform, transition, pointerEvents: defense ? 'none' : 'auto', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.35))' }}
      />
      {defense && (
        <Card
          {...defense}
          className="absolute top-0 left-0 z-[2]"
          style={{ transform: defenseTransform, transition, pointerEvents: 'auto', filter: 'drop-shadow(0 10px 16px rgba(0,0,0,.45))' }}
        />
      )}
    </div>
  );
}

TableCardPair.propTypes = {
  attack: PropTypes.object.isRequired,
  defense: PropTypes.object,
  dir: PropTypes.oneOf(['right', 'left', 'up', 'down']),
  overlap: PropTypes.number,
  cardW: PropTypes.number,
  cardH: PropTypes.number,
};
