const { EventEmitter } = require('events');

class JackpotWheel extends EventEmitter {
  constructor(io, config = {}) {
    super();
    this.io = io;
    this.config = Object.assign({
      ROUND_DURATION_MS: 30000,
      LOCK_MS: 2500,
      RAKE: 0.05,
    }, config);
    this.roundId = 0;
    this.state = 'OPEN';
    this.bets = { red: [], orange: [] };
    this.startRound();
  }

  startRound() {
    this.roundId += 1;
    this.state = 'OPEN';
    this.bets = { red: [], orange: [] };
    this.io.emit('round:state', { roundId: this.roundId, state: this.state, bank: this.getBank() });
    const openTime = this.config.ROUND_DURATION_MS - this.config.LOCK_MS;
    this.openTimer = setTimeout(() => this.lockRound(), openTime);
  }

  lockRound() {
    this.state = 'LOCK';
    const bank = this.getBank();
    this.io.emit('round:locked', { roundId: this.roundId, bankSnapshot: bank });
    this.lockTimer = setTimeout(() => this.spinRound(), this.config.LOCK_MS);
  }

  spinRound() {
    this.state = 'SPIN';
    this.io.emit('round:state', { roundId: this.roundId, state: this.state });
    this.spinTimer = setTimeout(() => this.resultRound(), 2000);
  }

  resultRound() {
    this.state = 'RESULT';
    const bank = this.getBank();
    const total = bank.red + bank.orange;
    if (total === 0) {
      this.io.emit('round:result', { roundId: this.roundId, winnerColor: null, payouts: [] });
      return this.startRound();
    }
    const pick = Math.random() * total;
    const winnerColor = pick < bank.red ? 'red' : 'orange';
    const rake = total * this.config.RAKE;
    const payoutPool = total - rake;
    const winnerBank = bank[winnerColor];
    const mult = winnerBank > 0 ? payoutPool / winnerBank : 0;
    const payouts = this.bets[winnerColor].map(b => ({
      userId: b.userId,
      amount: +(b.amount * mult).toFixed(2),
    }));
    this.io.emit('round:result', { roundId: this.roundId, winnerColor, payouts });
    setTimeout(() => this.startRound(), 2000);
  }

  getBank() {
    return {
      red: this.bets.red.reduce((s, b) => s + b.amount, 0),
      orange: this.bets.orange.reduce((s, b) => s + b.amount, 0),
    };
  }

  placeBet(userId, color, amount) {
    if (this.state !== 'OPEN') throw new Error('bets_closed');
    if (!['red', 'orange'].includes(color)) throw new Error('invalid_color');
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) throw new Error('invalid_amount');
    this.bets[color].push({ userId, amount: amt });
    this.io.emit('bet:placed', { userId, color, amount: amt, roundId: this.roundId, bank: this.getBank() });
  }
}

module.exports = JackpotWheel;
