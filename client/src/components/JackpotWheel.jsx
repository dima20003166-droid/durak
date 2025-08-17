import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import confetti from 'canvas-confetti';

const defaultSpinConfig = {
  initialSpeed: 360,
  acceleration: 0.5,
  deceleration: 2,
  maxSpins: 12,
  ease: 'circ.out',
  glowColor: '#00eaff',
};

function useWheel(bank) {
  return useMemo(() => {
    const total = bank.red + bank.orange;
    const redAngle = total ? (bank.red / total) * 360 : 180;
    const segments = [
      { color: 'var(--jackpot-red)', start: 0, end: redAngle },
      { color: 'var(--jackpot-orange)', start: redAngle, end: 360 },
    ];
    return { segments };
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

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export default function JackpotWheel({
  phase,
  winner,
  bank,
  startTime,
  animationDuration,
  targetAngle,
  timeLeft,
  totalTime,
  state,
  volume,
  spinConfig,
}) {
  const [displayBank, setDisplayBank] = useState(bank);
  useEffect(() => {
    if (state === 'OPEN') setDisplayBank(bank);
  }, [bank.red, bank.orange, state]);
  const { segments } = useWheel(displayBank);
  const totalChance = displayBank.red + displayBank.orange;
  const redProbAngle = totalChance ? (displayBank.red / totalChance) * 360 : 180;
  const arrowRef = useRef(null);
  const wheelRef = useRef(null);
  const [radius, setRadius] = useState(0);
  const startSound = useRef();
  const spinSound = useRef();
  const winSound = useRef();
  const hasCelebrated = useRef(false);
  const config = useMemo(() => ({ ...defaultSpinConfig, ...(spinConfig || {}) }), [spinConfig]);
  const spins = useRef(defaultSpinConfig.maxSpins);
  const spinTween = useRef(null);
  const ringRadius = 49;
  const circumference = 2 * Math.PI * ringRadius;
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const dashOffset = circumference * (1 - progress);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
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
    const updateRadius = () => {
      if (wheelRef.current) setRadius(wheelRef.current.offsetWidth / 2);
    };
    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  const audioTl = useRef(null);
  const glowTl = useRef(null);

  useEffect(() => {
    return () => {
      [startSound.current, spinSound.current, winSound.current].forEach((s) => {
        if (s) {
          s.pause();
          s.currentTime = 0;
        }
      });
      spinTween.current?.kill();
      audioTl.current?.kill();
      glowTl.current?.kill();
    };
  }, []);

  useEffect(() => {
    if (phase === 'idle') {
      spins.current = config.maxSpins;
      spinTween.current?.kill();
      gsap.set(arrowRef.current, { rotation: 0, boxShadow: 'none' });
      hasCelebrated.current = false;
      glowTl.current?.kill();
      gsap.set(wheelRef.current?.querySelectorAll('.wheel-segment'), { opacity: 1 });
      audioTl.current?.kill();
      if (spinSound.current) {
        audioTl.current = gsap.timeline();
        audioTl.current.to(spinSound.current, {
          volume: 0,
          duration: 0.5,
          onComplete: () => {
            spinSound.current.pause();
            spinSound.current.volume = volume;
          },
        });
      }
    }
    if (phase === 'spinning') {
      startSound.current?.play();
      if (spinSound.current) {
        spinSound.current.volume = 0;
        spinSound.current.loop = true;
        spinSound.current.play();
        audioTl.current = gsap.timeline();
        audioTl.current.to(spinSound.current, { volume, duration: 0.5 });
      }
      const totalRotation = spins.current * 360 + targetAngle;
      const now = Date.now();
      const drift = now - startTime;
      const duration = Math.max(0, animationDuration - Math.max(0, drift)) / 1000;
      const current = totalRotation * Math.max(0, drift) / animationDuration;
      spinTween.current?.kill();
      gsap.set(arrowRef.current, { rotation: current });
      if (duration > 0) {
        spinTween.current = gsap.to(arrowRef.current, {
          rotation: totalRotation,
          duration,
          ease: config.ease || 'power4.out',
        });
      } else {
        gsap.set(arrowRef.current, { rotation: totalRotation });
      }
      if (!prefersReducedMotion) {
        const segs = wheelRef.current?.querySelectorAll('.wheel-segment');
        glowTl.current = gsap.timeline({ repeat: -1, yoyo: true });
        glowTl.current.to(segs, { opacity: 0.7, duration: 0.3, stagger: 0.1 });
        glowTl.current.to(
          arrowRef.current,
          { boxShadow: `0 0 15px ${config.glowColor}`, duration: 0.3 },
          0
        );
      }
    }
  }, [phase, startTime, animationDuration, targetAngle, volume, config, prefersReducedMotion]);

  useEffect(() => {
    if (!winner) return;
    spinTween.current?.kill();
    audioTl.current?.kill();
    if (spinSound.current) {
      audioTl.current = gsap.timeline();
      audioTl.current.to(spinSound.current, {
        volume: 0,
        duration: 0.5,
        onComplete: () => {
          spinSound.current.pause();
          spinSound.current.volume = volume;
        },
      });
    }
    winSound.current?.play();
    if (!hasCelebrated.current && !prefersReducedMotion) {
      const rect = arrowRef.current.getBoundingClientRect();
      confetti({
        particleCount: 40,
        spread: 45,
        origin: { x: rect.left / window.innerWidth, y: rect.top / window.innerHeight },
      });
      const cTl = gsap.timeline();
      cTl.to(arrowRef.current, { className: '+=win-effect', duration: 0 });
      cTl.to(arrowRef.current, { className: '-=win-effect', delay: 0.8, duration: 0 });
      cTl.play();
      hasCelebrated.current = true;
    }
  }, [winner, volume, prefersReducedMotion]);

  return (
    <div
      ref={wheelRef}
      className="relative w-60 sm:w-72 md:w-[300px] aspect-square mx-auto font-neon"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
        <motion.div ref={arrowRef} className="origin-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            style={{ transform: `translateY(-${radius}px)` }}
          >
            <defs>
              <linearGradient id="arrowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" />
                <stop offset="100%" stopColor="#ccc" />
              </linearGradient>
              <filter id="arrowShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={config.glowColor} />
              </filter>
            </defs>
            <polygon
              points="12,0 24,24 0,24"
              fill="url(#arrowGradient)"
              filter="url(#arrowShadow)"
            />
          </svg>
        </motion.div>
      </div>
      <div className="absolute inset-0 rounded-full p-1 bg-neon-primary/30 shadow-[0_0_15px_var(--neon-primary)]">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full rounded-full overflow-hidden"
          style={{ filter: 'drop-shadow(0 0 5px var(--neon-primary))' }}
        >
          <defs>
            <linearGradient id="redSegment" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff7f7f" />
              <stop offset="100%" stopColor="#ff0000" />
            </linearGradient>
            <linearGradient id="orangeSegment" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffd27f" />
              <stop offset="100%" stopColor="#ff8c00" />
            </linearGradient>
            <filter id="segmentShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={config.glowColor} />
            </filter>
          </defs>
          {segments.map((seg, i) => (
            <path
              key={i}
              className="wheel-segment"
              d={segmentPath(50, 50, 50, seg.start, seg.end)}
              fill={`url(#${seg.color === 'var(--jackpot-red)' ? 'redSegment' : 'orangeSegment'})`}
              filter="url(#segmentShadow)"
            />
          ))}
        </svg>
        <div className="absolute inset-0 rounded-full pointer-events-none bg-white/10" />
      </div>
      <svg
        viewBox="0 0 100 100"
        className={`absolute inset-0 pointer-events-none ${state !== 'OPEN' ? 'opacity-50' : ''}`}
        style={{ zIndex: 1 }}
      >
        <path
          d={arcPath(50, 50, 49, 0, redProbAngle)}
          stroke="var(--jackpot-red)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d={arcPath(50, 50, 49, redProbAngle, 360)}
          stroke="var(--jackpot-orange)"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      {totalTime > 0 && (
        <svg
          viewBox="0 0 100 100"
          className={`absolute inset-0 w-full h-full -rotate-90 pointer-events-none ${state !== 'OPEN' ? 'opacity-50' : ''}`}
        >
          <circle
            cx="50"
            cy="50"
            r={ringRadius}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
      )}
      <div className={`absolute inset-0 flex items-center justify-center text-3xl font-bold text-white pointer-events-none ${state !== 'OPEN' ? 'opacity-50' : ''}`}>
        {totalTime > 0 ? Math.ceil(timeLeft / 1000) : ''}
      </div>
    </div>
  );
}

JackpotWheel.propTypes = {
  phase: PropTypes.string.isRequired,
  winner: PropTypes.string,
  bank: PropTypes.shape({
    red: PropTypes.number,
    orange: PropTypes.number,
  }).isRequired,
  startTime: PropTypes.number,
  animationDuration: PropTypes.number,
  targetAngle: PropTypes.number,
  timeLeft: PropTypes.number,
  totalTime: PropTypes.number,
  state: PropTypes.string.isRequired,
  volume: PropTypes.number,
  spinConfig: PropTypes.shape({
    initialSpeed: PropTypes.number,
    acceleration: PropTypes.number,
    deceleration: PropTypes.number,
    maxSpins: PropTypes.number,
    ease: PropTypes.string,
    glowColor: PropTypes.string,
  }),
};

JackpotWheel.defaultProps = {
  winner: null,
  startTime: 0,
  animationDuration: 0,
  targetAngle: 0,
  timeLeft: 0,
  totalTime: 0,
  state: 'OPEN',
  volume: 1,
  spinConfig: defaultSpinConfig,
};
