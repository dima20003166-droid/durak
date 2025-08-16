import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import resolveAvatarUrl from '../../utils/resolveAvatarUrl';

export default function ProfileModal({ user, onClose }) {
  const backdropRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    contentRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab') {
        const focusable = contentRef.current?.querySelectorAll('button');
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
  }, [user, onClose]);

  if (!user) return null;

  const handleBackdrop = (e) => {
    if (e.target === backdropRef.current) onClose?.();
  };

  const stats = user.stats || { wins: 0, losses: 0 };
  const total = (stats.wins || 0) + (stats.losses || 0);
  const winRate = total ? Math.round((stats.wins / total) * 100) : 0;

  return (
    <AnimatePresence>
      <motion.div
        ref={backdropRef}
        className="fixed inset-0 bg-bg/70 z-50 flex items-center justify-center"
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
          className="bg-surface p-6 rounded-xl border border-border w-full max-w-md"
        >
          <div className="flex items-center gap-4">
            <img
              className="w-16 h-16 rounded-full object-cover"
              src={resolveAvatarUrl(
                user.avatarUrl,
                `https://placehold.co/64x64/1f2937/ffffff?text=${user.username?.[0] || 'U'}`
              )}
              alt=""
            />
            <div>
              <div className="text-xl font-bold">{user.username}</div>
              <div className="text-muted">Рейтинг: {user.rating ?? '—'}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div className="bg-surface rounded p-2">
              <div className="text-xs text-muted">Игры</div>
              <div className="text-lg font-bold">{total}</div>
            </div>
            <div className="bg-surface rounded p-2">
              <div className="text-xs text-muted">Победы</div>
              <div className="text-lg font-bold text-primary">{stats.wins || 0}</div>
            </div>
            <div className="bg-surface rounded p-2">
              <div className="text-xs text-muted">Пораж.</div>
              <div className="text-lg font-bold text-danger">{stats.losses || 0}</div>
            </div>
          </div>

          <div className="text-center text-sm text-muted mt-2">Винрейт: {winRate}%</div>

          <div className="mt-6 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary hover:bg-primary/80 rounded transition-colors"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

ProfileModal.propTypes = {
  user: PropTypes.object,
  onClose: PropTypes.func,
};

