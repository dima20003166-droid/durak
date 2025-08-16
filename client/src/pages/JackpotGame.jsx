import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import socketService from '../services/socketService';
import JackpotWheel from '../components/JackpotWheel';
import BetPanel from '../components/BetPanel';
import AnimatedCounter from '../components/AnimatedCounter';
import PlayerBetList from '../components/PlayerBetList';

export default function JackpotGame({ initialRound }) {
  const [state, setState] = useState(initialRound?.state || 'OPEN');
  const [bank, setBank] = useState(initialRound?.bank || { red: 0, orange: 0 });
  const [winner, setWinner] = useState(null);
  const [bets, setBets] = useState({ red: [], orange: [] });
  const [timeLeft, setTimeLeft] = useState(initialRound?.timeLeftMs ? Math.round(initialRound.timeLeftMs / 1000) : 0);
  const bankRef = useRef(bank);
  const bankAfterResultRef = useRef(null);
  const delayedBankTimer = useRef(null);

  useEffect(() => {
    socketService.on('round:state', (d) => {
      if (d.state === 'OPEN') {
        setState('OPEN');
        setWinner(null);
        if (!(d.openMs || d.timeLeftMs)) setBets({ red: [], orange: [] });
        const ms = d.timeLeftMs != null ? d.timeLeftMs : d.openMs;
        setTimeLeft(Math.round((ms || 0) / 1000));
        if (delayedBankTimer.current) clearTimeout(delayedBankTimer.current);
        const snapshot = bankAfterResultRef.current || bankRef.current;
        setBank(snapshot);
        delayedBankTimer.current = setTimeout(() => {
          if (d.bank) setBank(d.bank);
          bankAfterResultRef.current = null;
        }, 3000);
      } else {
        setState(d.state);
        setWinner(null);
        const ms = d.timeLeftMs != null ? d.timeLeftMs : d.openMs;
        if (['OPEN', 'LOCK', 'SPIN'].includes(d.state)) setTimeLeft(Math.round((ms || 0) / 1000));
        else setTimeLeft(0);
      }
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
    socketService.on('round:locked', (d) => {
      if (d.bankSnapshot) setBank(d.bankSnapshot);
      setState('LOCK');
      setTimeLeft(0);
    });
    socketService.on('round:result', (d) => {
      bankAfterResultRef.current = bankRef.current;
      setState('RESULT');
      setWinner(d.winnerColor);
    });
    socketService.connect();
    return () => {
      socketService.off('round:state');
      socketService.off('bet:placed');
      socketService.off('round:locked');
      socketService.off('round:result');
      if (delayedBankTimer.current) clearTimeout(delayedBankTimer.current);
    };
  }, []);

  useEffect(() => {
    bankRef.current = bank;
  }, [bank]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

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
      <JackpotWheel state={state} winner={winner} bank={bank} timeLeft={timeLeft} />
      <motion.div
        className="w-full bg-black/40 backdrop-blur-md rounded-xl overflow-hidden shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <BetPanel state={state} />
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

