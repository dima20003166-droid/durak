import React, { useEffect, useState } from 'react';
import socketService from '../services/socketService';
import JackpotWheel from '../components/JackpotWheel';
import BetPanel from '../components/BetPanel';

export default function JackpotWheelSection() {
  const [state, setState] = useState('OPEN');
  const [bank, setBank] = useState({ red: 0, orange: 0 });
  const [winner, setWinner] = useState(null);
  const [serverSeedHash, setServerSeedHash] = useState('');
  const [serverSeed, setServerSeed] = useState('');

  useEffect(() => {
    socketService.on('round:state', (d) => {
      setState(d.state);
      if (d.bank) setBank(d.bank);
      if (d.serverSeedHash) setServerSeedHash(d.serverSeedHash);
      setWinner(null);
      setServerSeed('');
    });
    socketService.on('bet:placed', (d) => {
      if (d.bank) setBank(d.bank);
    });
    socketService.on('round:locked', () => setState('LOCK'));
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

  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <h1 className="text-3xl font-bold">Джекпот-колесо</h1>
      <JackpotWheel state={state} winner={winner} />
      <BetPanel bank={bank} state={state} />
      {serverSeedHash && (
        <div className="text-xs text-center flex flex-col items-center gap-1">
          <div>Server hash: {serverSeedHash}</div>
          {serverSeed && <div>Server seed: {serverSeed}</div>}
          <a
            href="https://github.com/dima20003166-droid/durak/blob/extract-files/server/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Проверить честность
          </a>
        </div>
      )}
    </div>
  );
}
