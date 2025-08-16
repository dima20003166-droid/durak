const test = require('node:test');
const assert = require('node:assert');
const JackpotWheel = require('../jackpotWheel');

const originalSetTimeout = global.setTimeout;

test('idempotent clientBetId', () => {
  global.setTimeout = () => 0;
  const io = { emit() {} };
  const jw = new JackpotWheel(io, { ROUND_DURATION_MS: 1000000, LOCK_MS: 1000 });
  jw.placeBet('u1', 'red', 10, 'bet1');
  jw.placeBet('u1', 'red', 10, 'bet1');
  const bank = jw.getBank();
  assert.strictEqual(bank.red, 10);
  global.setTimeout = originalSetTimeout;
});

test('probability distribution', () => {
  global.setTimeout = () => 0;
  let red = 0,
    orange = 0;
  const io = {
    emit(event, data) {
      if (event === 'round:result') {
        if (data.winnerColor === 'red') red++;
        else if (data.winnerColor === 'orange') orange++;
      }
    },
  };
  const jw = new JackpotWheel(io, {
    ROUND_DURATION_MS: 1000000,
    LOCK_MS: 1000,
    RAKE: 0,
  });
  jw.startRound = () => {};
  for (let i = 0; i < 100000; i++) {
    jw.bets = {
      red: [{ userId: 'a', amount: 1 }],
      orange: [{ userId: 'b', amount: 1 }],
    };
    jw.resultRound();
  }
  const total = red + orange;
  const redProb = red / total;
  assert.ok(Math.abs(redProb - 0.5) < 0.005);
  global.setTimeout = originalSetTimeout;
});
