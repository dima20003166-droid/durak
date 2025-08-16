import React, { useState } from 'react';
import socketService from '../services/socketService';
import AnimatedCounter from './AnimatedCounter';

export default function BetPanel({ bank, state }) {
  const [amount, setAmount] = useState(1);
  const place = (color) => {
    const clientBetId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    socketService.placeWheelBet(color, amount, clientBetId);
  };
  return (
    <div className="space-y-2">
      <div className="flex justify-center gap-4 text-sm">
        <div>
          Red: <AnimatedCounter value={bank.red} />
        </div>
        <div>
          Orange: <AnimatedCounter value={bank.orange} />
        </div>
      </div>
      <input
        type="number"
        min="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-32 text-center bg-bg border border-border rounded"
      />
      <div className="flex gap-4 justify-center">
        <button
          disabled={state !== 'OPEN'}
          onClick={() => place('red')}
          className="px-4 py-2 rounded bg-red-500 text-white disabled:opacity-50"
        >
          Red
        </button>
        <button
          disabled={state !== 'OPEN'}
          onClick={() => place('orange')}
          className="px-4 py-2 rounded bg-orange-500 text-white disabled:opacity-50"
        >
          Orange
        </button>
      </div>
    </div>
  );
}
