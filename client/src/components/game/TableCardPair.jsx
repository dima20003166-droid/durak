// client/src/components/game/TableCardPair.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Card from '../Card';

// --- детерминированный PRNG (mulberry32) + хэш строки ---
function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash32(str) {
  let h = 2166136261 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return (h >>> 0) || 1;
}

export default function TableCardPair({
  attack,
  defense,
  dir = 'right',
  overlap = 0.62,     // чуть больше перекрытие
  cardW = 90,
  cardH = 135,
  seed,               // <— можно передать снаружи, иначе соберём сами
  slotIndex,          // <— опционально, помогает стабильности
}) {
  const ov = Math.min(Math.max(overlap, 0.5), 0.7);
  const isH = dir === 'right' || dir === 'left';
  const sign = (dir === 'right' || dir === 'down') ? 1 : -1;

  // сид: стабильный для одной и той же пары
  const seedKey = `${seed ?? ''}|${attack?.id ?? attack?.code ?? ''}|${defense?.id ?? defense?.code ?? ''}|${slotIndex ?? ''}|${dir}`;
  const rng = useMemo(() => mulberry32(hash32(seedKey)), [seedKey]);
  const r = (min, max) => min + (max - min) * rng();

  // базовые углы
  const attackRotBase = { right: 2, left: -2, down: 2, up: -2 }[dir] || 0;
  const defenseRotBase = { right: -6, left: 6, down: -5, up: 5 }[dir] || 0;

  // детерминированный «джиттер» (не дрожит)
  const attackRot = useMemo(() => attackRotBase + r(-1.5, 1.5), []);      // 1 раз
  const defenseRot = useMemo(() => defenseRotBase + r(-2, 2), []);        // 1 раз
  const randShift  = useMemo(() => r(-3, 3), []);                         // 1 раз

  const shiftPx = (isH ? cardW : cardH) * (1 - ov);

  const attackOrigin = isH ? (dir === 'right' ? 'center left' : 'center right')
                           : (dir === 'down'  ? 'top center'  : 'bottom center');
  const defenseOrigin = attackOrigin;

  const attackWrapTransform  = `rotate(${attackRot}deg)`;
  const defenseWrapTransform = isH
    ? `translateX(${sign * shiftPx + randShift}px) translateY(-5px) rotate(${defenseRot}deg) rotateX(7deg)`
    : `translateY(${sign * shiftPx + randShift}px) rotate(${defenseRot}deg) rotateX(7deg)`;

  const transition = 'transform 200ms cubic-bezier(.18,.89,.32,1.28)';

  return (
    <div
      className="table-card-pair"
      style={{
        position: 'relative',
        width: `${cardW}px`,
        height: `${cardH}px`,
        perspective: '900px',
      }}
    >
      {/* Атака */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: attackOrigin,
          transform: attackWrapTransform,
          transition,
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.35))',
          zIndex: 1,
        }}
      >
        <Card {...attack} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Отбой */}
      {defense && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: defenseOrigin,
            transform: defenseWrapTransform,
            transition,
            filter: 'drop-shadow(0 8px 12px rgba(0,0,0,.45))',
            zIndex: 2,
            pointerEvents: 'auto',
          }}
        >
          <Card {...defense} style={{ width: '100%', height: '100%' }} />
        </div>
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
  seed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  slotIndex: PropTypes.number,
};
