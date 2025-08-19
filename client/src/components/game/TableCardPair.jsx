import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Card from '../Card';

export default function TableCardPair({ attack, defense, dir = 'right', overlap = 0.5 }) {
  const ov = Math.min(Math.max(overlap, 0.45), 0.6);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const attackRot = useMemo(() => ({ right: 3, left: -3, down: 3, up: -3 })[dir] || 0, [dir]);
  const defenseRot = useMemo(() => ({ right: -7, left: 7, down: -7, up: 7 })[dir] || 0, [dir]);

  const mainShift = useMemo(() => {
    switch (dir) {
      case 'right':
        return `translateX(calc((1 - ${ov}) * var(--card-w)))`;
      case 'left':
        return `translateX(calc((${ov} - 1) * var(--card-w)))`;
      case 'down':
        return `translateY(calc((1 - ${ov}) * var(--card-h) - 6px))`;
      case 'up':
        return `translateY(calc((${ov} - 1) * var(--card-h) - 6px))`;
      default:
        return '';
    }
  }, [dir, ov]);

  const defenseTransform = useMemo(() => {
    const lift = dir === 'right' || dir === 'left' ? ' translateY(-6px)' : '';
    return `${mainShift}${lift} rotate(${defenseRot}deg) rotateX(6deg)`;
  }, [mainShift, defenseRot, dir]);

  const attackTransform = useMemo(() => `rotate(${attackRot}deg) rotateX(5deg)`, [attackRot]);

  const transition = prefersReducedMotion ? 'none' : 'transform 200ms cubic-bezier(.18,.89,.32,1.28), filter 200ms cubic-bezier(.18,.89,.32,1.28)';

  return (
    <div className="relative group" style={{ width: 'var(--card-w)', height: 'var(--card-h)', willChange: 'transform' }}>
      <Card
        {...attack}
        className="absolute top-0 left-0 [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.2))] group-hover:[filter:drop-shadow(0_3px_3px_rgba(0,0,0,0.3))]"
        style={{ transform: attackTransform, transition, pointerEvents: defense ? 'none' : 'auto' }}
      />
      {defense && (
        <Card
          {...defense}
          className="absolute top-0 left-0 z-[1] [filter:drop-shadow(0_4px_4px_rgba(0,0,0,0.4))] group-hover:[filter:drop-shadow(0_6px_6px_rgba(0,0,0,0.5))]"
          style={{ transform: defenseTransform, transition, pointerEvents: 'auto' }}
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
};
