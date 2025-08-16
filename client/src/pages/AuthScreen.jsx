// client/src/pages/AuthScreen.jsx
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ReCAPTCHA from 'react-google-recaptcha';
import socketService from '../services/socketService';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const AuthScreen = ({ setPage, setCurrentUser }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

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

              </>
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
