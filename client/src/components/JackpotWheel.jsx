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
};

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

export default function JackpotWheel({
  phase,
  winner,
  bank,
  startTime,
  animationDuration,
  targetAngle,
  timeLeft,
  totalTime,
  volume,
  spinConfig,
}) {
  const { segments, redAngle } = useWheel(bank);
  const arrowRef = useRef(null);
  const wheelRef = useRef(null);
  const [radius, setRadius] = useState(0);
  const startSound = useRef();
  const spinSound = useRef();
  const winSound = useRef();
  const hasCelebrated = useRef(false);
  const config = useMemo(() => ({ ...defaultSpinConfig, ...(spinConfig || {}) }), [spinConfig]);
  const spins = useRef(defaultSpinConfig.maxSpins);
  const startOffsetRef = useRef(0);
  const spinTween = useRef(null);
  const ringRadius = 49;
  const circumference = 2 * Math.PI * ringRadius;
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const dashOffset = circumference * (1 - progress);

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

  useEffect(() => {
    if (phase === 'idle') {
      spins.current = config.maxSpins;
      spinTween.current?.kill();
      gsap.set(arrowRef.current, { rotation: 0 });
      hasCelebrated.current = false;
      if (spinSound.current) {
        gsap.to(spinSound.current, {
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
        gsap.to(spinSound.current, { volume, duration: 0.5 });
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
    }
  }, [phase, startTime, animationDuration, targetAngle, volume, config]);

  useEffect(() => {
    if (!winner) return;
    const winAngle =
      winner === 'red' ? redAngle / 2 : redAngle + (360 - redAngle) / 2;
    spinTween.current?.kill();
    const currentRot = gsap.getProperty(arrowRef.current, 'rotation');
    const currentNorm = ((currentRot % 360) + 360) % 360;
    const finalNorm = (startOffsetRef.current + winAngle) % 360;
    const delta = (finalNorm - currentNorm + 360) % 360;
    const totalSpins = Math.min(spins.current, config.maxSpins);
    const totalRotation = totalSpins * 360 + delta;
    const accelRot = config.initialSpeed * config.acceleration;
    let decelRot = config.initialSpeed * config.deceleration;
    let constRot = totalRotation - accelRot - decelRot;
    if (constRot < 0) {
      decelRot += constRot;
      constRot = 0;
    }
    const constDur = constRot / config.initialSpeed;
    spinTween.current = gsap.timeline({
      defaults: { transformOrigin: 'center center' },
      onComplete: () => {
        if (spinSound.current) {
          gsap.to(spinSound.current, {
            volume: 0,
            duration: 0.5,
            onComplete: () => {
              spinSound.current.pause();
              spinSound.current.volume = volume;
            },
          });
        }
        winSound.current?.play();
        if (!hasCelebrated.current) {
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
      },
    });
    spinTween.current.to(arrowRef.current, {
      rotation: currentRot + accelRot,
      duration: config.acceleration,
      ease: 'power2.in',
    });
    if (constRot > 0) {
      spinTween.current.to(arrowRef.current, {
        rotation: `+=${constRot}`,
        duration: constDur,
        ease: 'linear',
      });
    }
    spinTween.current.to(arrowRef.current, {
      rotation: `+=${decelRot}`,
      duration: config.deceleration,
      ease: config.ease || 'power4.out',
    });
  }, [winner, redAngle, volume, config]);

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
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00eaff" />
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
          {segments.map((seg, i) => (
            <path key={i} d={segmentPath(50, 50, 50, seg.start, seg.end)} fill={seg.color} />
          ))}
        </svg>
        <div className="absolute inset-0 rounded-full pointer-events-none bg-white/10" />
      </div>
      {totalTime > 0 && (
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
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
      <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white pointer-events-none">
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
  volume: PropTypes.number,
  spinConfig: PropTypes.shape({
    initialSpeed: PropTypes.number,
    acceleration: PropTypes.number,
    deceleration: PropTypes.number,
    maxSpins: PropTypes.number,
    ease: PropTypes.string,
  }),
};

JackpotWheel.defaultProps = {
  winner: null,
  startTime: 0,
  animationDuration: 0,
  targetAngle: 0,
  timeLeft: 0,
  totalTime: 0,
  volume: 1,
  spinConfig: defaultSpinConfig,
};
