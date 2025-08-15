import React, { useEffect, useState } from 'react';
import socketService from '../services/socketService';

const AuthModal = ({ open, initialMode = 'login', onClose }) => {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setUsername('');
      setPassword('');
      setPassword2('');
      setError('');
      setLoading(false);
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return;
    const onLoginError = (msg) => { setError(msg || 'Ошибка входа'); setLoading(false); };
    const onLoginSuccess = () => { setLoading(false); onClose?.(); };
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
  }, [open, onClose]);

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

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-bg/50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md p-6 bg-surface rounded-2xl">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-semibold">{mode === 'login' ? 'Войти' : 'Регистрация'}</h2>
          <button onClick={onClose} className="text-xl">×</button>
        </div>
        <div className="flex bg-surface/80 rounded-lg overflow-hidden mb-4">
          <button type="button" onClick={() => setMode('login')} className={`flex-1 py-2 font-semibold ${mode === 'login' ? 'bg-primary text-bg' : ''}`}>Войти</button>
          <button type="button" onClick={() => setMode('register')} className={`flex-1 py-2 font-semibold ${mode === 'register' ? 'bg-primary text-bg' : ''}`}>Регистрация</button>
        </div>
        {error && <div className="text-danger text-sm mb-2">{error}</div>}
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
      </div>
    </div>
  );
};

export default AuthModal;
