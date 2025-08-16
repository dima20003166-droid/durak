import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import confetti from 'canvas-confetti';

function useWheel(bank) {
  return useMemo(() => {
    const total = bank.red + bank.orange;
    const redAngle = total ? (bank.red / total) * 360 : 180;
    const segments = [
      { color: 'var(--jackpot-red)', start: 0, end: redAngle },
      { color: 'var(--jackpot-orange)', start: redAngle, end: 360 },
    ];
    return { segments, redAngle };
  }, [bank.red, bank.orange]);
}

function polarToCartesian(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segmentPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export default function JackpotWheel({ state, winner, bank, timeLeft, volume }) {
  const { segments, redAngle } = useWheel(bank);
  const [rotation, setRotation] = useState(0);
  const arrowRef = useRef(null);
  const startSound = useRef();
  const spinSound = useRef();
  const winSound = useRef();

  useEffect(() => {
    startSound.current = new Audio('/start.mp3');
    spinSound.current = new Audio('/spin.mp3');
    winSound.current = new Audio('/win.mp3');
  }, []);

  useEffect(() => {
    [startSound.current, spinSound.current, winSound.current].forEach((a) => {
      if (a) a.volume = volume;
    });
  }, [volume]);

  useEffect(() => {
    if (state === 'SPIN') {
      startSound.current?.play();
      if (spinSound.current) {
        spinSound.current.loop = true;
        spinSound.current.play();
      }
      setRotation(720);
    }
    if (state === 'OPEN') {
      setRotation(0);
      gsap.set(arrowRef.current, { rotation: 0 });
    }
  }, [state]);

  useEffect(() => {
    if (state === 'SPIN' && winner) {
      const winAngle =
        winner === 'red' ? redAngle / 2 : redAngle + (360 - redAngle) / 2;
      const target = 720 + winAngle;
      spinSound.current?.pause();
      winSound.current?.play();
      setRotation(target);
      const rect = arrowRef.current.getBoundingClientRect();
      confetti({
        particleCount: 40,
        spread: 45,
        origin: { x: rect.left / window.innerWidth, y: rect.top / window.innerHeight },
      });
      arrowRef.current.classList.add('win-effect');
      setTimeout(() => arrowRef.current.classList.remove('win-effect'), 800);
    }
  }, [winner, state, redAngle]);

  useEffect(() => {
    const ease = state === 'SPIN' && !winner ? 'power2.in' : 'power3.out';
    gsap.to(arrowRef.current, { rotation, duration: 2, ease });
  }, [rotation, state, winner]);

  return (
    <div className="relative w-60 sm:w-72 md:w-[300px] aspect-square mx-auto font-neon">
      <div className="absolute inset-0 rounded-full p-1 bg-neon-primary/30 shadow-[0_0_15px_var(--neon-primary)]">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full rounded-full overflow-hidden"
          style={{ filter: 'drop-shadow(0 0 5px var(--neon-primary))' }}
        >
          {segments.map((seg, i) => (
            <path key={i} d={segmentPath(50, 50, 50, seg.start, seg.end)} fill={seg.color} />
          ))}
        </svg>
        <div className="absolute inset-0 rounded-full pointer-events-none bg-white/10" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white pointer-events-none">
        {timeLeft > 0 ? Math.ceil(timeLeft) : ''}
      </div>
      <motion.div
        ref={arrowRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full origin-bottom pointer-events-none"
      >
        <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white mx-auto drop-shadow-[0_0_6px_var(--neon-primary)]" />
        <div
          className="w-[2px] bg-white mx-auto drop-shadow-[0_0_6px_var(--neon-primary)]"
          style={{ height: 'calc(50% + 20px)' }}
        />
      </motion.div>
    </div>
  );
}

JackpotWheel.propTypes = {
  state: PropTypes.string.isRequired,
  winner: PropTypes.string,
  bank: PropTypes.shape({
    red: PropTypes.number,
    orange: PropTypes.number,
  }).isRequired,
  timeLeft: PropTypes.number,
  volume: PropTypes.number,
};

JackpotWheel.defaultProps = {
  winner: null,
  timeLeft: 0,
  volume: 1,
};
