// client/src/pages/AuthScreen.jsx
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import socketService from '../services/socketService';

const AuthScreen = ({ setPage, setCurrentUser, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { setMode(initialMode); }, [initialMode]);

  useEffect(() => {
    const onLoginError = (msg) => { setError(msg || 'Ошибка входа'); setLoading(false); };
    const onLoginSuccess = (user) => { setLoading(false); setCurrentUser?.(user); setPage?.('lobby'); };
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
  }, [setPage, setCurrentUser]);

  const handleLogin = () => {
    setError('');
    if (!username || !password) return setError('Введите логин и пароль');
    setLoading(true);
    socketService.login({ username, password });
  };

  const handleRegister = () => {
    setError('');
    if (!username || !password || !password2) return setError('Заполните все поля');
    if (password !== password2) return setError('Пароли не совпадают');
    setLoading(true);
    socketService.register({ username, password });
  };

  const handleGuest = () => {
    const name = username || `Гость_${Math.floor(Math.random()*1000)}`;
    socketService.guestLogin(name);
  };

    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-text">
        <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-2xl shadow-2xl shadow-primary/10 border border-border transition-transform hover:scale-[1.02]">
          <h1 className="text-4xl font-display font-bold text-center text-primary">DURAK.IO</h1>

          <div className="flex bg-surface/80 rounded-lg overflow-hidden">
            <button type="button" onClick={() => setMode('login')} className={`flex-1 py-2 font-semibold ${mode==='login' ? 'bg-primary text-bg' : ''}`}>Войти</button>
            <button type="button" onClick={() => setMode('register')} className={`flex-1 py-2 font-semibold ${mode==='register' ? 'bg-primary text-bg' : ''}`}>Регистрация</button>
          </div>

          {error && <div className="text-danger text-sm">{error}</div>}

          <div className="space-y-4">
            <input type="text" placeholder="Имя пользователя" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 bg-surface/60 rounded-lg"/>
            <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-surface/60 rounded-lg"/>
            {mode === 'register' && (
              <input type="password" placeholder="Повторите пароль" value={password2} onChange={e => setPassword2(e.target.value)} className="w-full px-4 py-3 bg-surface/60 rounded-lg"/>
            )}
            {mode === 'login' ? (
              <button type="button" onClick={handleLogin} disabled={loading} className="w-full py-3 font-semibold text-text bg-primary rounded-lg hover:bg-primary/80">
                Войти
              </button>
            ) : (
              <button type="button" onClick={handleRegister} disabled={loading} className="w-full py-3 font-semibold text-text bg-primary rounded-lg hover:bg-primary/80">
                Зарегистрироваться
              </button>
            )}
          </div>

          <div className="text-center text-xs text-muted pt-2">
            Аккаунты: player/player, admin/admin
          </div>

          <button type="button" onClick={handleGuest} className="w-full py-2 text-sm font-semibold text-bg bg-accent rounded-lg hover:bg-accent/80">
            Зайти гостем
          </button>
        </div>
      </div>
    );
};

export default AuthScreen;

AuthScreen.propTypes = {
  setPage: PropTypes.func,
  setCurrentUser: PropTypes.func,
};
