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
  const [volume, setVolume] = useState(1);

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

  const copyHash = () => {
    if (serverSeedHash) navigator.clipboard.writeText(serverSeedHash);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 flex flex-col items-center gap-6 py-10">
      <h1 className="text-3xl font-bold">Джекпот-колесо</h1>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="w-32"
      />
      <JackpotWheel state={state} winner={winner} bank={bank} timeLeft={timeLeft} volume={volume} />
      <BetPanel state={state} />
      <div className="w-full bg-surface rounded shadow">
        <div className="flex justify-center p-3 border-b border-divider">
          <div className="bg-surface px-4 py-2 rounded-full shadow text-primary font-semibold">
            Банк: <AnimatedCounter value={totalBank} />
          </div>
        </div>
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col md:border-r-2 border-divider">
          <div className="p-3 font-bold border-b border-divider text-red-400 text-left">
            Красный — {bank.red}
          </div>
          <PlayerBetList bets={bets.red} textColor="text-red-400" align="left" />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="p-3 font-bold border-b border-divider text-orange-400 text-right">
            Оранжевый — {bank.orange}
          </div>
          <PlayerBetList bets={bets.orange} textColor="text-orange-400" align="right" />
        </div>
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
