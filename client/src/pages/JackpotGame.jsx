import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import socketService from '../services/socketService';
import JackpotWheel from '../components/JackpotWheel';
import BetPanel from '../components/BetPanel';
import AnimatedCounter from '../components/AnimatedCounter';
import PlayerBetList from '../components/PlayerBetList';
import WinLossPopup from '../components/WinLossPopup';

export default function JackpotGame({ initialRound, user }) {
  const [phase, setPhase] = useState(initialRound?.phase || 'idle');
  const [state, setState] = useState(initialRound?.state || 'OPEN');
  const [bank, setBank] = useState(initialRound?.bank || { red: 0, orange: 0 });
  const [bets, setBets] = useState(initialRound?.bets || { red: [], orange: [] });
  const [startTime, setStartTime] = useState(initialRound?.startTime || 0);
  const [animationDuration, setAnimationDuration] = useState(initialRound?.animationDuration || 0);
  const [targetAngle, setTargetAngle] = useState(initialRound?.targetAngle || 0);
  const [skew, setSkew] = useState(() =>
    typeof initialRound?.serverNow === 'number' ? initialRound.serverNow - Date.now() : 0,
  );
  const [openUntil, setOpenUntil] = useState(
    initialRound?.openUntil ??
      (typeof initialRound?.timeLeftMs === 'number' ? Date.now() + initialRound.timeLeftMs : 0),
  );
  const [timeLeft, setTimeLeft] = useState(
    openUntil ? Math.max(0, openUntil - (Date.now() + skew)) : 0,
  );
  const [openMs, setOpenMs] = useState(initialRound?.openDuration || initialRound?.openMs || 0);
  const [result, setResult] = useState(initialRound?.result || null);
  const [spinEndAt, setSpinEndAt] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(null);
  const [displayPayout, setDisplayPayout] = useState(null);
  const [chance, setChance] = useState({ red: 50, orange: 50 });
  const { t } = useTranslation();
  const winner = phase === 'settled' && result ? result.color : null;
  const bankRef = useRef(bank);
  const betsRef = useRef(bets);

  useEffect(() => {
    const onState = (d) => {
      setPhase(d.phase);
      setState(d.state || 'OPEN');
      if (d.bank) setBank(d.bank);
      if (d.bets) setBets(d.bets);
      setStartTime(d.startTime || 0);
      setAnimationDuration(d.animationDuration || 0);
      setTargetAngle(d.targetAngle || 0);
      setResult(d.result || null);
      const now = Date.now();
      let skewVal = skew;
      if (typeof d.serverNow === 'number') {
        skewVal = d.serverNow - now;
        setSkew(skewVal);
      }
      if (typeof d.openUntil === 'number') {
        setOpenUntil(d.openUntil);
        setTimeLeft(Math.max(0, d.openUntil - (now + skewVal)));
      } else if (typeof d.timeLeftMs === 'number') {
        const deadline = now + d.timeLeftMs;
        setOpenUntil(deadline);
        setTimeLeft(d.timeLeftMs);
      }
      if (typeof d.openDuration === 'number') setOpenMs(d.openDuration);
      if ((d.state || 'OPEN') === 'OPEN') {
        setPendingPayout(null);
        setDisplayPayout(null);
      }
    };
    const onBetPlaced = (d) => {
      if (d.bank) setBank(d.bank);
      setBets((prev) => ({
        ...prev,
        [d.color]: [
          ...prev[d.color],
          {
            userId: d.userId,
            username: d.username || d.userId,
            amount: d.amount,
            id: d.clientBetId || `${d.userId}-${Date.now()}`,
          },
        ],
      }));
    };
    const onStart = (d) => {
      setState(d.state || 'SPIN');
      setPhase('spinning');
      setStartTime(d.startTime);
      setAnimationDuration(d.animationDuration);
      setTargetAngle(d.targetAngle);
      setSpinEndAt(Date.now() + d.animationDuration);
    };
    const onResult = (d) => {
      setState(d.state || 'RESULT');
      setResult(d.result);
    };
    const onSettled = (d) => {
      setState(d.state || 'RESULT');
      setPhase('settled');
      if (d.bank) setBank(d.bank);
      setResult(d.result);
      setBets({ red: [], orange: [] });
      setTimeLeft(0);
      setOpenMs(0);
    };
    const onRoundResult = (d) => {
      if (!user?.id) return;
      const win = (d.payouts || []).find((p) => p.userId === user.id);
      if (win) {
        setPendingPayout(win.amount);
      } else {
        const b = betsRef.current;
        const loss = [...b.red, ...b.orange]
          .filter((bet) => bet.userId === user.id)
          .reduce((s, b) => s + b.amount, 0);
        if (loss > 0) setPendingPayout(-loss);
      }
    };
    socketService.on('jackpot:state', onState);
    socketService.on('bet:placed', onBetPlaced);
    socketService.on('jackpot:start', onStart);
    socketService.on('jackpot:result', onResult);
    socketService.on('jackpot:settled', onSettled);
    socketService.on('jackpot:roundResult', onRoundResult);
    socketService.connect();
    return () => {
      socketService.off('jackpot:state', onState);
      socketService.off('bet:placed', onBetPlaced);
      socketService.off('jackpot:start', onStart);
      socketService.off('jackpot:result', onResult);
      socketService.off('jackpot:settled', onSettled);
      socketService.off('jackpot:roundResult', onRoundResult);
    };
  }, [user]);

  useEffect(() => {
    bankRef.current = bank;
    betsRef.current = bets;
  }, [bank, bets]);

  useEffect(() => {
    const tick = () => {
      if (state === 'OPEN' && openUntil) {
        setTimeLeft(Math.max(0, openUntil - (Date.now() + skew)));
      } else {
        setTimeLeft(0);
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [openUntil, skew, state]);

  useEffect(() => {
    if (state === 'OPEN') {
      const total = bank.red + bank.orange;
      const red = total ? (bank.red / total) * 100 : 50;
      setChance({ red, orange: 100 - red });
    }
  }, [bank, state]);

  const totalBank = bank.red + bank.orange;

  useEffect(() => {
    if (pendingPayout != null) {
      const delay = Math.max(spinEndAt - Date.now(), 0);
      const t = setTimeout(() => {
        setDisplayPayout(pendingPayout);
        setPendingPayout(null);
      }, delay);
      return () => clearTimeout(t);
    }
  }, [pendingPayout, spinEndAt]);

  useEffect(() => {
    if (displayPayout != null) {
      const t = setTimeout(() => setDisplayPayout(null), 1300);
      return () => clearTimeout(t);
    }
  }, [displayPayout]);

  return (
    <motion.div
      className="w-full flex flex-col items-center gap-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-950 via-purple-800 to-fuchsia-700 text-white shadow-xl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.h2
        className="text-4xl font-extrabold tracking-wider drop-shadow-lg"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        Джекпот
      </motion.h2>
      <div className="relative">
        <JackpotWheel
          phase={phase}
          winner={winner}
          bank={bank}
          startTime={startTime}
          animationDuration={animationDuration}
          targetAngle={targetAngle}
          timeLeft={timeLeft}
          totalTime={openMs}
          state={state}
        />
        <WinLossPopup amount={displayPayout} />
      </div>
      <div className={`flex gap-4 text-sm font-bold mt-2 ${state !== 'OPEN' ? 'opacity-50' : ''}`}>
        {[
          { key: 'red', value: chance.red, textColor: 'text-red-300', barColor: 'bg-red-500' },
          { key: 'orange', value: chance.orange, textColor: 'text-orange-300', barColor: 'bg-orange-500' },
        ].map(({ key, value, textColor, barColor }) => (
          <div
            key={key}
            className={`flex flex-col items-center bg-black/30 rounded-lg px-3 py-2 shadow ${textColor}`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${barColor} shadow`} />
              <span>{t(key)}</span>
            </div>
            <div className="w-24 h-2 bg-white/20 rounded mt-1">
              <div className={`h-full ${barColor} rounded`} style={{ width: `${value}%` }} />
            </div>
            <AnimatedCounter value={value} formatValue={(v) => `${v.toFixed(0)}%`} />
          </div>
        ))}
      </div>
      <motion.div
        className="w-full bg-black/40 backdrop-blur-md rounded-xl overflow-hidden shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <BetPanel state={state} />
        <div className="flex flex-col">
          <div className="flex flex-col md:flex-row items-center justify-center border-b border-white/20">
            <div className="flex-1 p-3 font-bold text-red-300 text-left leading-tight">
              Красный — {bank.red}
            </div>
            <div className="p-3 font-bold flex flex-col items-center text-center leading-tight">
              <span>Банк:</span>
              <AnimatedCounter value={totalBank} />
            </div>
            <div className="flex-1 p-3 font-bold text-orange-300 text-right leading-tight">
              {bank.orange} — Оранжевый
            </div>
          </div>
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 flex flex-col md:border-r border-white/20">
              <PlayerBetList bets={bets.red} textColor="text-red-300" align="left" />
            </div>
            <div className="flex-1 flex flex-col">
              <PlayerBetList bets={bets.orange} textColor="text-orange-300" align="right" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

JackpotGame.propTypes = {
  initialRound: PropTypes.object,
  user: PropTypes.shape({
    id: PropTypes.string,
    username: PropTypes.string,
  }),
};

JackpotGame.defaultProps = {
  initialRound: null,
  user: null,
};

