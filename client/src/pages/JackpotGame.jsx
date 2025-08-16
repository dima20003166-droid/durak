import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import socketService from '../services/socketService';
import JackpotWheel from '../components/JackpotWheel';
import BetPanel from '../components/BetPanel';
import AnimatedCounter from '../components/AnimatedCounter';
import PlayerBetList from '../components/PlayerBetList';

export default function JackpotGame({ initialRound }) {
  const [phase, setPhase] = useState(initialRound?.phase || 'idle');
  const [bank, setBank] = useState(initialRound?.bank || { red: 0, orange: 0 });
  const [bets, setBets] = useState(initialRound?.bets || { red: [], orange: [] });
  const [startTime, setStartTime] = useState(initialRound?.startTime || 0);
  const [animationDuration, setAnimationDuration] = useState(initialRound?.animationDuration || 0);
  const [targetAngle, setTargetAngle] = useState(initialRound?.targetAngle || 0);
  const [result, setResult] = useState(initialRound?.result || null);
  const winner = phase === 'settled' && result ? result.color : null;
  const bankRef = useRef(bank);

  useEffect(() => {
    socketService.on('jackpot:state', (d) => {
      setPhase(d.phase);
      if (d.bank) setBank(d.bank);
      if (d.bets) setBets(d.bets);
      setStartTime(d.startTime || 0);
      setAnimationDuration(d.animationDuration || 0);
      setTargetAngle(d.targetAngle || 0);
      setResult(d.result || null);
    });
    socketService.on('bet:placed', (d) => {
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
    });
    socketService.on('jackpot:start', (d) => {
      setPhase('spinning');
      setStartTime(d.startTime);
      setAnimationDuration(d.animationDuration);
      setTargetAngle(d.targetAngle);
    });
    socketService.on('jackpot:result', (d) => {
      setResult(d.result);
    });
    socketService.on('jackpot:settled', (d) => {
      setPhase('settled');
      if (d.bank) setBank(d.bank);
      setResult(d.result);
      setBets({ red: [], orange: [] });
    });
    socketService.connect();
    return () => {
      socketService.off('jackpot:state');
      socketService.off('bet:placed');
      socketService.off('jackpot:start');
      socketService.off('jackpot:result');
      socketService.off('jackpot:settled');
    };
  }, []);

  useEffect(() => {
    bankRef.current = bank;
  }, [bank]);

  const totalBank = bank.red + bank.orange;

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
      <JackpotWheel
        phase={phase}
        winner={winner}
        bank={bank}
        startTime={startTime}
        animationDuration={animationDuration}
        targetAngle={targetAngle}
      />
      <motion.div
        className="w-full bg-black/40 backdrop-blur-md rounded-xl overflow-hidden shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <BetPanel state={phase} />
        <div className="flex flex-col">
          <div className="flex flex-col md:flex-row items-center justify-center border-b border-white/20">
            <div className="flex-1 p-3 font-bold text-red-300 text-left">
              Красный — {bank.red}
            </div>
            <div className="p-3 font-bold flex items-center justify-center">
              Банк: <AnimatedCounter value={totalBank} />
            </div>
            <div className="flex-1 p-3 font-bold text-orange-300 text-right">
              Оранжевый — {bank.orange}
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

