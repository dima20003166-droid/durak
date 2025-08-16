import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import socketService from '../services/socketService';

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const backdropRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    contentRef.current?.focus();
    const keyHandler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  }, [onClose]);

  useEffect(() => {
    const onLoginError = (msg) => { setError(msg || 'Ошибка входа'); setLoading(false); };
    const onLoginSuccess = () => { setLoading(false); setError(''); onClose?.(); };
    const onRegisterSuccess = () => { setMode('login'); setError(''); setLoading(false); };
    const onRegisterError = (msg) => { setError(msg || 'Ошибка регистрации'); setLoading(false); };

    socketService.on('login_error', onLoginError);
    socketService.on('login_success', onLoginSuccess);
    socketService.on('register_success', onRegisterSuccess);
    socketService.on('register_error', onRegisterError);

    return () => {
      socketService.off('login_error', onLoginError);
      socketService.off('login_success', onLoginSuccess);
      socketService.off('register_success', onRegisterSuccess);
      socketService.off('register_error', onRegisterError);
    };
  }, [onClose]);


  const handleLogin = () => {
    setError('');
    const uname = username.trim();
    if (!uname || !password) return setError('Введите логин и пароль');
    setLoading(true);
    socketService.login({ username: uname, password });
  };

  const handleRegister = () => {
    setError('');
    const uname = username.trim();
    const unameNorm = uname.toLowerCase();
    if (!uname || !password || !password2) return setError('Заполните все поля');

    if (password !== password2) return setError('Пароли не совпадают');
    setLoading(true);
    socketService.register({ username: unameNorm, password });
  };

  const handleGuest = () => {
    const name = username || `Гость_${Math.floor(Math.random()*1000)}`;
    socketService.guestLogin(name);
  };

  const handleBackdrop = (e) => { if (e.target === backdropRef.current) onClose?.(); };

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
          className="w-full max-w-md p-8 space-y-6 bg-surface rounded-2xl shadow-2xl shadow-primary/10 border border-border"
        >
          <h1 className="text-4xl font-display font-bold text-center text-primary">DURAK.IO</h1>
          <div className="flex bg-surface/80 rounded-lg overflow-hidden">
            <button type="button" onClick={() => setMode('login')} className={`flex-1 py-2 font-semibold ${mode==='login' ? 'bg-primary text-bg' : ''}`}>Войти</button>
            <button type="button" onClick={() => setMode('register')} className={`flex-1 py-2 font-semibold ${mode==='register' ? 'bg-primary text-bg' : ''}`}>Регистрация</button>
          </div>
          {error && <div className="text-danger text-sm">{error}</div>}
          <div className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Логин"
              className="w-full p-3 bg-bg border border-border rounded-lg"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className="w-full p-3 bg-bg border border-border rounded-lg"
            />
            {mode === 'register' && (
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Повторите пароль"
                className="w-full p-3 bg-bg border border-border rounded-lg"
              />
            )}
          </div>
          {mode === 'login' ? (
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 font-semibold text-text bg-primary rounded-lg hover:bg-primary/80"
            >
              Войти
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-3 font-semibold text-text bg-primary rounded-lg hover:bg-primary/80"
            >
              Зарегистрироваться
            </button>
          )}
          <div className="text-center text-xs text-muted pt-2">
            Аккаунты: player/player, admin/admin
          </div>
          <button type="button" onClick={handleGuest} className="w-full py-2 text-sm font-semibold text-bg bg-accent rounded-lg hover:bg-accent/80">Зайти гостем</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

AuthModal.propTypes = {
  onClose: PropTypes.func,
};
