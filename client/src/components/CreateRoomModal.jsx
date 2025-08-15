import React, { useState } from 'react';
import socketService from '../services/socketService';
import Dialog from './ui/Dialog';

export default function CreateRoomModal({ open, onClose }) {
  const [bet, setBet] = useState(50);
  const [mode, setMode] = useState('classic');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const createRoom = () => {
    setSubmitting(true);
    setError('');
    socketService.emit('room:create', { bet, mode, privateRoom: isPrivate }, (res) => {
      setSubmitting(false);
      if (!res?.ok) {
        setError(res?.msg || 'Не удалось создать стол.');
        return;
      }
      onClose?.();
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-4 w-[92%] max-w-sm bg-surface rounded-xl shadow-lg text-text">
        <h3 className="text-xl font-bold mb-3">Создать стол</h3>
        <label className="block text-sm text-muted mb-1">Ставка</label>
        <input
          type="number"
          min={1}
          step={1}
          value={bet}
          onChange={(e) => setBet(Number(e.target.value))}
          className="w-full mb-3 rounded-md bg-surface text-text p-2 outline-none"
        />
        <label className="block text-sm text-muted mb-1">Режим</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="w-full mb-3 rounded-md bg-surface text-text p-2"
        >
          <option value="classic">Классика</option>
          <option value="transfer">Подкидной</option>
        </select>
        <label className="inline-flex items-center gap-2 text-muted mb-3">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          Приватный стол
        </label>
        {error && <div className="text-danger text-sm mb-3">{error}</div>}
        <div className="flex gap-2">
          <button
            disabled={submitting}
            onClick={createRoom}
            className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-md text-text font-semibold disabled:opacity-50"
          >
            {submitting ? 'Создаю…' : 'Создать'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface hover:bg-surface/80 rounded-md text-text"
          >
            Отмена
          </button>
        </div>
      </div>
    </Dialog>
  );
}
