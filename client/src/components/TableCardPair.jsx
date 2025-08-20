// client/src/components/game/TableCardPair.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Card from '../Card';

/** Реалистичное перекрытие: защитная карта накрывает атакующую ~на половину */
export default function TableCardPair({
  attack,
  defense,
  dir = 'right',
  overlap = 0.5,
  cardW = 110,   // можно подставить свои размеры
  cardH = 160,
}) {
  // нормируем overlap
  const ov = Math.min(Math.max(overlap, 0.45), 0.6);
  const isH = dir === 'right' || dir === 'left';
  const sign = (dir === 'right' || dir === 'down') ? 1 : -1;

  // сдвиг защитной карты в px (никаких calc/var)
  const shiftPx = (1 - ov) * (isH ? cardW : cardH);

  // лёгкая противоположная «подкрутка» для реализма
  const attackRot = useMemo(() => ({ right: 3, left: -3, down: 3, up: -3 })[dir] || 0, [dir]);
  const defenseRot = useMemo(() => ({ right: -7, left: 7, down: -7, up: 7 })[dir] || 0, [dir]);

  const attackTransform = `rotate(${attackRot}deg)`;
  const defenseTransform = isH
    ? `translateX(${sign * shiftPx}px) translateY(-6px) rotate(${defenseRot}deg) rotateX(7deg)`
    : `translateY(${sign * shiftPx}px) rotate(${defenseRot}deg) rotateX(7deg)`;

  return (
    <div
      className="table-card-pair"
      style={{
        position: 'relative',
        width: `${cardW}px`,
        height: `${cardH}px`,
        // подсветка для дебага: видно рамку пары
        // outline: '1px dashed rgba(255,255,255,.2)'
      }}
    >
      <Card
        rank={attack?.rank} suit={attack?.suit} faceUp={attack?.faceUp !== false}
        className="attack"
        style={{
          position: 'absolute', left: 0, top: 0,
          transform: attackTransform,
          zIndex: 1,
          filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.35))',
          transition: 'transform 220ms cubic-bezier(.18,.89,.32,1.28)'
        }}
      />
      {defense && (
        <Card
          rank={defense?.rank} suit={defense?.suit} faceUp={defense?.faceUp !== false}
          className="defense"
          style={{
            position: 'absolute', left: 0, top: 0,
            transform: defenseTransform,
            zIndex: 2,
            filter: 'drop-shadow(0 10px 16px rgba(0,0,0,.45))',
            transition: 'transform 220ms cubic-bezier(.18,.89,.32,1.28)'
          }}
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
