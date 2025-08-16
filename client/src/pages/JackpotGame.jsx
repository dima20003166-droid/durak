import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
  const [timeLeft, setTimeLeft] = useState(initialRound?.timeLeftMs || 0);
  const [openMs, setOpenMs] = useState(initialRound?.openMs || 0);
  const [result, setResult] = useState(initialRound?.result || null);
  const [spinEndAt, setSpinEndAt] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(null);
  const [displayPayout, setDisplayPayout] = useState(null);
  const [chance, setChance] = useState({ red: 50, orange: 50 });
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
      if (typeof d.timeLeftMs === 'number') setTimeLeft(d.timeLeftMs);
      if (typeof d.openMs === 'number') setOpenMs(d.openMs);
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
      setSpinEndAt(d.startTime + d.animationDuration);
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
    socketService.on('round:result', onRoundResult);
    socketService.connect();
    return () => {
      socketService.off('jackpot:state', onState);
      socketService.off('bet:placed', onBetPlaced);
      socketService.off('jackpot:start', onStart);
      socketService.off('jackpot:result', onResult);
      socketService.off('jackpot:settled', onSettled);
      socketService.off('round:result', onRoundResult);
    };
  }, [user]);

  useEffect(() => {
    bankRef.current = bank;
    betsRef.current = bets;
  }, [bank, bets]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => (state === 'OPEN' && t > 0 ? t - 1000 : t));
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    if (state === 'OPEN') {
      const total = bank.red + bank.orange;
      const red = total ? (bank.red / total) * 100 : 50;
      setChance({ red, orange: 100 - red });
    }
  }, [bank, state]);

  const totalBank = bank.red + bank.orange;

  useEffect(() => {
    if (pendingPayout != null && phase === 'settled' && Date.now() >= spinEndAt) {
      setDisplayPayout(pendingPayout);
      setPendingPayout(null);
    }
  }, [pendingPayout, phase, spinEndAt]);

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
        <div className="text-red-300">
          Red ~ <AnimatedCounter value={chance.red} formatValue={(v) => `${v.toFixed(0)}%`} />
        </div>
        <div className="text-orange-300">
          Orange ~ <AnimatedCounter value={chance.orange} formatValue={(v) => `${v.toFixed(0)}%`} />
        </div>
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
              — {bank.orange} Оранжевый
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

