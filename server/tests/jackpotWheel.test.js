const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const JackpotWheel = require('../jackpotWheel');

const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;

test('idempotent clientBetId', () => {
  global.setTimeout = () => 0;
  const io = { emit() {} };
  const jw = new JackpotWheel(io, { ROUND_DURATION_MS: 1000000, LOCK_MS: 1000 });
  jw.placeBet('u1', 'User', 'red', 10, 'bet1');
  jw.placeBet('u1', 'User', 'red', 10, 'bet1');
  const bank = jw.getBank();
  assert.strictEqual(bank.red, 10);
  global.setTimeout = originalSetTimeout;
});

test('negative or zero bet invalid_amount', () => {
  global.setTimeout = () => 0;
  const io = { emit() {} };
  const jw = new JackpotWheel(io, { ROUND_DURATION_MS: 1000000, LOCK_MS: 1000 });
  assert.throws(() => jw.placeBet('u1', 'User', 'red', -5), /invalid_amount/);
  assert.throws(() => jw.placeBet('u1', 'User', 'red', 0), /invalid_amount/);
  global.setTimeout = originalSetTimeout;
});

test('bet outside MIN/MAX invalid_amount', () => {
  global.setTimeout = () => 0;
  const io = { emit() {} };
  const jw = new JackpotWheel(io, { ROUND_DURATION_MS: 1000000, LOCK_MS: 1000, MIN_BET: 5, MAX_BET: 10 });
  assert.throws(() => jw.placeBet('u1', 'User', 'red', 4), /invalid_amount/);
  assert.throws(() => jw.placeBet('u1', 'User', 'red', 11), /invalid_amount/);
  global.setTimeout = originalSetTimeout;
});

test('bet when not open throws', () => {
  global.setTimeout = () => 0;
  const io = { emit() {} };
  const jw = new JackpotWheel(io, { ROUND_DURATION_MS: 1000000, LOCK_MS: 1000 });
  jw.state = 'LOCK';
  assert.throws(() => jw.placeBet('u1', 'User', 'red', 10), /bets_closed/);
  global.setTimeout = originalSetTimeout;
});

test('deterministic winner by serverSeed', () => {
  global.setTimeout = () => 0;
  let winner = null;
  const io = {
    emit(event, data) {
      if (event === 'round:result') winner = data.winnerColor;
    },
  };
  const jw = new JackpotWheel(io, { ROUND_DURATION_MS: 1000000, LOCK_MS: 1000, RAKE: 0 });
  jw.startRound = () => {};
  const seed = 'fixedseed';
  jw.serverSeed = seed;
  jw.bets = { red: [{ userId: 'a', amount: 1 }], orange: [{ userId: 'b', amount: 2 }] };
  jw.resultRound();
  const rand =
    parseInt(crypto.createHash('sha256').update(seed).digest('hex').slice(0, 8), 16) /
    0xffffffff;
  const expected = rand * 3 < 1 ? 'red' : 'orange';
  assert.strictEqual(winner, expected);
  global.setTimeout = originalSetTimeout;
});

test('clientBetId reused next round', () => {
  global.setTimeout = () => 0;
  const io = { emit() {} };
  const jw = new JackpotWheel(io, { ROUND_DURATION_MS: 1000000, LOCK_MS: 1000 });
  jw.placeBet('u1', 'User', 'red', 10, 'bet1');
  jw.resultRound();
  jw.startRound();
  jw.placeBet('u1', 'User', 'red', 10, 'bet1');
  assert.strictEqual(jw.getBank().red, 10);
  global.setTimeout = originalSetTimeout;
});

test('payouts sum to payoutPool', () => {
  global.setTimeout = () => 0;
  let result = null;
  const io = {
    emit(event, data) {
      if (event === 'round:result') result = data;
    },
  };
  const jw = new JackpotWheel(io, { ROUND_DURATION_MS: 1000000, LOCK_MS: 1000, RAKE: 0 });
  jw.startRound = () => {};
  jw.serverSeed = '4';
  jw.bets = {
    red: [
      { userId: 'a', amount: 1 },
      { userId: 'b', amount: 1 },
      { userId: 'c', amount: 1 },
    ],
    orange: [{ userId: 'd', amount: 7 }],
  };
  jw.resultRound();
  const sum = result.payouts.reduce((s, p) => s + p.amount, 0);
  assert.strictEqual(+sum.toFixed(2), 10);
  global.setTimeout = originalSetTimeout;
});

test('startRound clears timers', () => {
  const timeouts = [];
  global.setTimeout = (fn) => {
    timeouts.push(fn);
    return timeouts.length - 1;
  };
  global.clearTimeout = (id) => {
    timeouts[id] = null;
  };
  const io = { emit() {} };
  const jw = new JackpotWheel(io, { ROUND_DURATION_MS: 1000, LOCK_MS: 100 });
  let lock = 0,
    spin = 0,
    result = 0;
  jw.lockRound = () => {
    lock++;
    jw.spinRound();
  };
  jw.spinRound = () => {
    spin++;
    jw.resultRound();
  };
  jw.resultRound = () => {
    result++;
  };
  jw.startRound();
  jw.startRound();
  timeouts.forEach((fn) => fn && fn());
  assert.strictEqual(lock, 1);
  assert.strictEqual(spin, 1);
  assert.strictEqual(result, 1);
  global.setTimeout = originalSetTimeout;
  global.clearTimeout = originalClearTimeout;
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
    jw.serverSeed = crypto.randomBytes(32).toString('hex');
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
