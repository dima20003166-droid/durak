import React from 'react';

export default function ProvablyFair({ setPage }) {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold mb-4">Provably Fair</h1>
      <p>
        Игра использует commit-reveal механизм. В начале каждого раунда публикуется
        хэш server seed, после завершения раунда раскрывается сам seed.
      </p>
      <pre className="bg-surface p-4 rounded text-xs overflow-auto">
{`const crypto = require('crypto');
const serverSeed = '...';
const hash = crypto.createHash('sha256').update(serverSeed).digest('hex');
console.log(hash);`}
      </pre>
      <button
        className="px-4 py-2 rounded bg-primary text-text"
        onClick={() => setPage('lobby')}
      >
        Назад
      </button>
    </div>
  );
}
