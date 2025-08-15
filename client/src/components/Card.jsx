// client/src/components/Card.jsx
import React from 'react';
import { motion } from 'framer-motion';

const suitColor = (suit) => (suit === '♥' || suit === '♦' ? 'text-danger' : 'text-bg');
const suitFill  = (suit) => (suit === '♥' || suit === '♦' ? 'var(--color-danger)' : 'var(--color-bg)');

const SuitSvg = ({ suit, size=28 }) => {
  const fill = suitFill(suit);
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill, xmlns: 'http://www.w3.org/2000/svg' };
  switch (suit) {
    case '♥':
      return (<svg {...props}><path d="M12 21s-7.5-4.6-9.6-9C1 9 2.1 6 5 6c2.2 0 3.3 1.5 4 2.5C9.7 7.5 10.8 6 13 6c2.9 0 4 3 2.6 6-2.1 4.4-9.6 9-9.6 9z"/></svg>);
    case '♦':
      return (<svg {...props}><path d="M12 2l8 10-8 10L4 12 12 2z"/></svg>);
    case '♣':
      return (<svg {...props}><path d="M12 6a3 3 0 1 1 2.7 4.3A3 3 0 1 1 16 16h-2.2c.8 1.1 1.8 2.5 1.8 4H8.4c0-1.5 1-2.9 1.8-4H8a3 3 0 1 1 1.3-5.7A3 3 0 1 1 12 6z"/></svg>);
    case '♠':
    default:
      return (<svg {...props}><path d="M12 2s8 7 8 12a4 4 0 0 1-6.2 3.4c.8 1.1 1.7 2.6 1.7 4.2H8.5c0-1.6.9-3.1 1.7-4.2A4 4 0 0 1 4 14C4 9 12 2 12 2z"/></svg>);
  }
};

export default function Card({ suit='♠', rank='A', isFaceUp=true, isSelected=false, onClick, size='md', className='', style }) {
  const sizes = {
    sm: { w: 64, h: 90, rank: 14, corner: 16, pip: 24 },
    md: { w: 86, h: 120, rank: 16, corner: 18, pip: 28 },
    lg: { w: 104, h: 146, rank: 18, corner: 20, pip: 32 },
  };
  const S = sizes[size] || sizes.md;
  const borderSel = isSelected ? 'ring-2 ring-primary shadow-primary/40 -translate-y-2' : 'ring-1 ring-border';
  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onClick}
      className={`relative rounded-xl cursor-pointer select-none ${borderSel} ${className}`}
      style={{ width: S.w, height: S.h, perspective: 600, ...style }}
      whileHover={{ y: -4 }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFaceUp ? 0 : 180 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
          <div className="w-full h-full bg-text rounded-xl shadow-sm overflow-hidden">
            <div className="absolute top-1 left-1 flex flex-col items-center leading-none">
              <span className={`font-bold ${suitColor(suit)}`} style={{ fontSize: S.rank }}>{rank}</span>
              <span className={`${suitColor(suit)}`} style={{ fontSize: S.corner }}>{suit}</span>
            </div>
            <div className="absolute bottom-1 right-1 flex flex-col items-center rotate-180 leading-none">
              <span className={`font-bold ${suitColor(suit)}`} style={{ fontSize: S.rank }}>{rank}</span>
              <span className={`${suitColor(suit)}`} style={{ fontSize: S.corner }}>{suit}</span>
            </div>
            <div className="w-full h-full flex items-center justify-center">
              <SuitSvg suit={suit} size={S.pip} />
            </div>
          </div>
        </div>
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary to-accent ring-1 ring-primary shadow-md">
            <div className="w-full h-full grid place-items-center">
              <div className="w-4/5 h-4/5 rounded-lg border-2 border-text/60" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
