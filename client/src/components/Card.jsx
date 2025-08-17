// client/src/components/Card.jsx
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

/** Helpers */
const isRed = (suit) => suit === '♥' || suit === '♦';
const suitTextClass = (suit) => (isRed(suit) ? 'text-danger' : 'text-bg');
const suitFill = (suit) => (isRed(suit) ? 'var(--color-danger)' : 'var(--color-bg)');

/** Suit icon */
const SuitSvg = ({ suit, size = 28 }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: suitFill(suit), xmlns: 'http://www.w3.org/2000/svg' };
  switch (suit) {
    case '♥':
      return (<svg {...props}><path d="M12 21s-7.5-4.6-9.6-9C1 9 3 6 6 6c2.2 0 3.8 1.4 4.5 2.8C11.2 7.4 12.8 6 15 6c3 0 5 3 3.6 6-2.1 4.4-9.6 9-9.6 9z"/></svg>);
    case '♦':
      return (<svg {...props}><path d="M12 2l7.5 10L12 22 4.5 12 12 2z"/></svg>);
    case '♣':
      return (<svg {...props}><path d="M12 22l1-6c2 1 5 .2 6.2-2 1.3-2.3.5-5.3-1.8-6.6-1.6-.9-3.6-.8-5 0C11 5 9 5 7.4 4.4 5 3.5 2.4 4.6 1.5 7c-.9 2.3.2 5 2.5 6.1 1.8.9 3.9.7 5.4-.4l1 6.3H12z"/></svg>);
    default: // '♠'
      return (<svg {...props}><path d="M12 2s8 7 8 12a4 4 0 0 1-7.5 2.8c.8 1.1 1.5 2.6 1.5 4.2H10c0-1.6.7-3.1 1.5-4.2A4 4 0 0 1 4 14C4 9 12 2 12 2z"/></svg>);
  }
};
SuitSvg.propTypes = { suit: PropTypes.oneOf(['♠', '♣', '♥', '♦']).isRequired, size: PropTypes.number };

export default function Card({
  suit = '♠',
  rank = 'A',
  isFaceUp = true,
  isSelected = false,
  onClick,
  size = 'md',         // 'sm' | 'md' | 'lg' — без змін
  className = '',
  style,
  from,                // { x, y } — початкова позиція появи (опційно)
  layoutId,            // для FLIP анімацій — без змін
  isWinning = false,   // підсвітка перемоги — без змін
}) {
  /** Узгоджені розміри (співпадають з Tailwind токенами; є CSS-фолбеки в index.css) */
  const sizes = {
    sm: { rank: 14, corner: 16, pip: 22, frame: 'w-card-sm h-card-sm' },
    md: { rank: 16, corner: 18, pip: 28, frame: 'w-card-md h-card-md' },
    lg: { rank: 18, corner: 20, pip: 32, frame: 'w-card-lg h-card-lg' },
  };
  const S = sizes[size] || sizes.md;

  const stateClasses = isSelected
    ? 'ring-2 ring-primary shadow-[0_12px_36px_rgba(0,0,0,.5)] scale-[1.04] -translate-y-1'
    : 'ring-1 ring-border shadow-[0_8px_24px_rgba(0,0,0,.35)]';

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const isPointerFine =
    typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches;

  /** Мікроефект перемоги (легка вібрація + короткий тон) */
  useEffect(() => {
    if (!isWinning || typeof window === 'undefined') return;
    window.navigator?.vibrate?.(80);
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start(); osc.stop(ctx.currentTime + 0.18);
    } catch { /* ignore */ }
  }, [isWinning]);

  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <motion.div
      layoutId={layoutId}
      initial={from ? { x: from.x, y: from.y, opacity: 0.85, rotate: -2 } : false}
      animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
      whileHover={
        prefersReducedMotion || !isPointerFine
          ? {}
          : isFaceUp
          ? { y: -8, scale: 1.02 }
          : { y: -4, scale: 1.01 }
      }
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28, mass: 0.6 }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${rank}${suit}`}
      aria-pressed={onClick ? !!isSelected : undefined}
      data-state={isSelected ? 'selected' : 'idle'}
      data-size={size}
      className={[
        'durak-card relative select-none rounded-2xl overflow-hidden',
        'bg-surface text-bg',
        'transform-gpu will-change-transform will-change-opacity',
        'transition-transform transition-shadow duration-200',
        S.frame,
        stateClasses,
        isWinning ? 'win-effect' : '',
        className,
      ].join(' ')}
      style={style}
    >
      {/* глянцева рамка */}
      <div className="absolute inset-0 pointer-events-none card-frame" />

      {isFaceUp ? (
        <div className="relative w-full h-full card-face">
          {/* кути */}
          <div className="absolute top-1 left-1 leading-none text-center select-none">
            <div className={`font-bold ${suitTextClass(suit)}`} style={{ fontSize: S.rank }}>{rank}</div>
            <div className={`${suitTextClass(suit)}`} style={{ fontSize: S.corner }}>{suit}</div>
          </div>
          <div className="absolute bottom-1 right-1 rotate-180 leading-none text-center select-none">
            <div className={`font-bold ${suitTextClass(suit)}`} style={{ fontSize: S.rank }}>{rank}</div>
            <div className={`${suitTextClass(suit)}`} style={{ fontSize: S.corner }}>{suit}</div>
          </div>

          {/* піктограма масті */}
          <div className="absolute inset-0 grid place-items-center">
            <SuitSvg suit={suit} size={S.pip} />
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full card-back">
          <div className="absolute inset-2 rounded-xl border border-white/25 opacity-60" />
        </div>
      )}

      {/* блиск зверху */}
      <div className="absolute inset-0 pointer-events-none card-gloss" />
    </motion.div>
  );
}

Card.propTypes = {
  suit: PropTypes.oneOf(['♠', '♣', '♥', '♦']),
  rank: PropTypes.string,
  isFaceUp: PropTypes.bool,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  style: PropTypes.object,
  from: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
  layoutId: PropTypes.string,
  isWinning: PropTypes.bool,
};
