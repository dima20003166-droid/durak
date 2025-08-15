import React, { useState } from 'react';

const WalletScreen = ({ user, setPage }) => {
  const [tab, setTab] = useState('deposit');
  const balance = user?.balance ?? 0;

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-gray-200">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-emerald-400">Кошелек</h1>
        <button onClick={() => setPage('lobby')} className="bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600">Вернуться в лобби</button>
      </header>
      <div className="max-w-md mx-auto bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
        <p className="text-center text-lg mb-4">Текущий баланс: <span className="font-bold text-yellow-400">{balance} ₽</span></p>
        <div className="flex border-b border-gray-600 mb-6">
          <button type="button" onClick={() => setTab('deposit')} className={`flex-1 py-2 font-semibold ${tab === 'deposit' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400'}`}>Пополнить</button>
          <button type="button" onClick={() => setTab('withdraw')} className={`flex-1 py-2 font-semibold ${tab === 'withdraw' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400'}`}>Вывести</button>
        </div>
        {tab === 'deposit' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Пополнение баланса</h2>
            <input type="number" placeholder="Сумма" className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg" />
            <p className="text-xs text-gray-500">Платежные системы будут подключены позже</p>
            <button className="w-full py-3 font-semibold text-white bg-emerald-600 rounded-lg" onClick={() => alert('Функция в разработке')}>Перейти к оплате</button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Вывод средств</h2>
            <input type="number" placeholder="Сумма" className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg" />
            <input type="text" placeholder="Номер карты или кошелька" className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg" />
            <button className="w-full py-3 font-semibold text-white bg-emerald-600 rounded-lg" onClick={() => alert('Функция в разработке')}>Отправить заявку</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletScreen;
