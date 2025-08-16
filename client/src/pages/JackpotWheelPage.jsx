import React from 'react';

export default function JackpotWheelPage({ setPage }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-6">
      <h1 className="text-4xl font-bold">Джекпот-колесо</h1>
      <p>Игра находится в разработке.</p>
      <button
        className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/80"
        onClick={() => setPage('lobby')}
      >
        Назад в лобби
      </button>
    </div>
  );
}
