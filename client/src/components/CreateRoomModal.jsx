import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import socketService from '../services/socketService';

export default function CreateRoomModal({ onClose }) {
  const [bet, setBet] = useState(50);
  const [mode, setMode] = useState('classic');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const backdropRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    contentRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab') {
        const focusable = contentRef.current?.querySelectorAll('button, input, select, textarea');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleBackdrop = (e) => {
    if (e.target === backdropRef.current) onClose?.();
  };

  const createRoom = () => {
    setSubmitting(true);
    setError('');

    const handleCreated = () => {
      setSubmitting(false);
      cleanup();
      onClose?.();
    };

    const handleError = (msg) => {
      setSubmitting(false);
      setError(msg || 'Не удалось создать стол');
      cleanup();
    };

    const cleanup = () => {
      socketService.off('created_room', handleCreated);
      socketService.off('join_error', handleError);
    };

    socketService.on('created_room', handleCreated);
    socketService.on('join_error', handleError);
    socketService.createRoom({ bet, mode, isPrivate });
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={backdropRef}
        className="fixed inset-0 bg-bg/60 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdrop}
      >
        <motion.div
          ref={contentRef}
          tabIndex={-1}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md p-4 bg-surface rounded-xl shadow-lg text-text"
        >
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
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
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
            <button onClick={onClose} className="px-4 py-2 bg-surface hover:bg-surface/80 rounded-md text-text">
              Отмена
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

CreateRoomModal.propTypes = {
  onClose: PropTypes.func,
};

