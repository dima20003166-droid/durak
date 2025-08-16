import React, { useEffect, useState } from 'react';
import socketService from '../services/socketService';
import JackpotWheel from '../components/JackpotWheel';
import BetPanel from '../components/BetPanel';
import AnimatedCounter from '../components/AnimatedCounter';
import PlayerBetList from '../components/PlayerBetList';

export default function JackpotWheelSection() {
  const [state, setState] = useState('OPEN');
  const [bank, setBank] = useState({ red: 0, orange: 0 });
  const [winner, setWinner] = useState(null);
  const [serverSeedHash, setServerSeedHash] = useState('');
  const [serverSeed, setServerSeed] = useState('');
  const [bets, setBets] = useState({ red: [], orange: [] });
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    socketService.on('round:state', (d) => {
      setState(d.state);
      if (d.bank) setBank(d.bank);
      if (d.serverSeedHash) setServerSeedHash(d.serverSeedHash);
      setWinner(null);
      setServerSeed('');
      setBets({ red: [], orange: [] });
      if (d.state === 'OPEN') setTimeLeft(Math.round((d.openMs || 0) / 1000));
      else setTimeLeft(0);
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
    socketService.on('round:locked', () => {
      setState('LOCK');
      setTimeLeft(0);
    });
    socketService.on('round:result', (d) => {
      setState('RESULT');
      setWinner(d.winnerColor);
      if (d.serverSeed) setServerSeed(d.serverSeed);
    });
    socketService.connect();
    return () => {
      socketService.off('round:state');
      socketService.off('bet:placed');
      socketService.off('round:locked');
      socketService.off('round:result');
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const totalBank = bank.red + bank.orange;
  const redChance = totalBank ? (bank.red / totalBank) * 100 : 0;
  const orangeChance = totalBank ? (bank.orange / totalBank) * 100 : 0;
  const redMultiplier = bank.red ? totalBank / bank.red : 0;
  const orangeMultiplier = bank.orange ? totalBank / bank.orange : 0;

  const copyHash = () => {
    if (serverSeedHash) navigator.clipboard.writeText(serverSeedHash);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 flex flex-col items-center gap-6 py-10">
      <h1 className="text-3xl font-bold">Джекпот-колесо</h1>
      <JackpotWheel state={state} winner={winner} bank={bank} timeLeft={timeLeft} />
      <BetPanel bank={bank} state={state} />
      <div className="w-full relative bg-surface rounded shadow flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-700">
        <div className="flex-1 flex flex-col">
          <div className="p-3 font-bold border-b border-gray-700 text-red-400">Красный — {bank.red}</div>
          <PlayerBetList bets={bets.red} textColor="text-red-400" />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="p-3 font-bold border-b md:border-b-0 border-gray-700 text-orange-400">Оранжевый — {bank.orange}</div>
          <PlayerBetList bets={bets.orange} textColor="text-orange-400" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-surface px-4 py-2 rounded-full shadow text-primary font-semibold">
            Банк: <AnimatedCounter value={totalBank} />
          </div>
        </div>
      </div>
      <div className="w-full flex flex-col md:flex-row justify-between text-center gap-6">
        <div className="flex-1 text-red-400">
          <div className="font-semibold">Красный</div>
          <div>Сумма: <AnimatedCounter value={bank.red} /></div>
          <div>Шанс: {redChance.toFixed(2)}%</div>
          <div>×{redMultiplier.toFixed(2)}</div>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="font-semibold">Банк</div>
          <div className="mt-1">Сумма: <AnimatedCounter value={totalBank} /></div>
        </div>
        <div className="flex-1 text-orange-400">
          <div className="font-semibold">Оранжевый</div>
          <div>Сумма: <AnimatedCounter value={bank.orange} /></div>
          <div>Шанс: {orangeChance.toFixed(2)}%</div>
          <div>×{orangeMultiplier.toFixed(2)}</div>
        </div>
      </div>
      {serverSeedHash && (
        <div className="text-xs text-center flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span>Server hash: {serverSeedHash}</span>
            <button onClick={copyHash} className="px-2 py-1 rounded bg-primary text-text">Скопировать</button>
            <a
              href="https://github.com/dima20003166-droid/durak/blob/extract-files/server/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 rounded bg-primary text-text"
            >
              Проверить честность
            </a>
          </div>
          {serverSeed && <div>Server seed: {serverSeed}</div>}
        </div>
      )}
    </div>
  );
}
