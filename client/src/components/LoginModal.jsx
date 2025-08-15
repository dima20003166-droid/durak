import React, { useState, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import socketService from '../services/socketService';

export default function LoginModal({ onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onError = (msg) => { setError(msg || 'Ошибка входа'); setLoading(false); };
    const onSuccess = () => { setLoading(false); onClose?.(); };
    socketService.on('login_error', onError);
    socketService.on('login_success', onSuccess);
    return () => { socketService.off('login_error', onError); socketService.off('login_success', onSuccess); };
  }, [onClose]);

  const handleLogin = () => {
    setError('');
    if (username.length < 6 || password.length < 6) {
      return setError('Минимум 6 символов в нике и пароле');
    }
    if (!captcha) return setError('Подтвердите, что вы не робот');
    setLoading(true);
    socketService.login({ username, password, captchaToken: captcha });
  };

  return (
    <div className="fixed inset-0 bg-bg/70 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-surface p-6 rounded-xl border border-border w-full max-w-sm text-text" onClick={e=>e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Вход</h2>
        {error && <div className="text-danger text-sm mb-2">{error}</div>}
        <input className="w-full mb-2 px-3 py-2 rounded bg-surface/60" placeholder="Имя пользователя" value={username} onChange={e=>setUsername(e.target.value)} />
        <input type="password" className="w-full mb-2 px-3 py-2 rounded bg-surface/60" placeholder="Пароль" value={password} onChange={e=>setPassword(e.target.value)} />
        <div className="mb-4"><ReCAPTCHA sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" onChange={setCaptcha} /></div>
        <div className="flex gap-2 justify-end">
          <button onClick={handleLogin} disabled={loading} className="px-4 py-2 bg-primary rounded text-text font-semibold disabled:opacity-50">Войти</button>
          <button onClick={onClose} className="px-4 py-2 bg-surface rounded text-text">Отмена</button>
        </div>
      </div>
    </div>
  );
}
