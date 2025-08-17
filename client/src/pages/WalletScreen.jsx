import React, { useState } from 'react';
import PropTypes from 'prop-types';
import AnimatedCounter from '../components/AnimatedCounter';

const WalletScreen = ({ user, setPage }) => {
  const [tab, setTab] = useState('deposit');
  const balance = user?.balance ?? 0;

  return (
      <div className="min-h-screen p-8 bg-bg text-text">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold text-primary">Кошелек</h1>
          <button onClick={() => setPage('lobby')} className="bg-primary text-text font-bold py-2 px-4 rounded-lg hover:bg-primary/80">Вернуться в лобби</button>
        </header>
        <div className="max-w-md mx-auto bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-8">
          <p className="text-center text-lg mb-4">Текущий баланс: <AnimatedCounter value={balance} className="font-bold text-accent" /> ₽</p>
          <div className="flex border-b border-border mb-6">
            <button type="button" onClick={() => setTab('deposit')} className={`flex-1 py-2 font-semibold ${tab === 'deposit' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}>Пополнить</button>
            <button type="button" onClick={() => setTab('withdraw')} className={`flex-1 py-2 font-semibold ${tab === 'withdraw' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}>Вывести</button>
          </div>
          {tab === 'deposit' ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Пополнение баланса</h2>
              <input type="number" placeholder="Сумма" className="w-full px-4 py-3 bg-surface/60 border border-border rounded-lg" />
              <p className="text-xs text-muted">Платежные системы будут подключены позже</p>
              <button className="w-full py-3 font-semibold text-text bg-primary rounded-lg hover:bg-primary/80" onClick={() => alert('Функция в разработке')}>Перейти к оплате</button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Вывод средств</h2>
              <input type="number" placeholder="Сумма" className="w-full px-4 py-3 bg-surface/60 border border-border rounded-lg" />
              <input type="text" placeholder="Номер карты или кошелька" className="w-full px-4 py-3 bg-surface/60 border border-border rounded-lg" />
              <button className="w-full py-3 font-semibold text-text bg-primary rounded-lg hover:bg-primary/80" onClick={() => alert('Функция в разработке')}>Отправить заявку</button>
            </div>
          )}
        </div>
      </div>
    );
};

export default WalletScreen;

WalletScreen.propTypes = {
  user: PropTypes.shape({
    balance: PropTypes.number,
  }),
  setPage: PropTypes.func.isRequired,
};
