const { EventEmitter } = require('events');
const crypto = require('crypto');

class JackpotWheel extends EventEmitter {
  constructor(io, config = {}) {
    super();
    this.io = io;
    this.config = Object.assign({
      ROUND_DURATION_MS: 30000,
      LOCK_MS: 2500,
      RAKE: 0.05,
      MIN_BET: 1,
      MAX_BET: 1000,
    }, config);
    this.roundId = 0;
    this.state = 'OPEN';
    this.bets = { red: [], orange: [] };
    this.betIds = new Map(); // clientBetId -> true
    this.serverSeed = '';
    this.serverSeedHash = '';
    this.startRound();
  }

  startRound() {
    clearTimeout(this.openTimer);
    clearTimeout(this.lockTimer);
    clearTimeout(this.spinTimer);
    this.openTimer = this.lockTimer = this.spinTimer = null;
    this.roundId += 1;
    this.state = 'OPEN';
    this.bets = { red: [], orange: [] };
    this.serverSeed = crypto.randomBytes(32).toString('hex');
    this.serverSeedHash = crypto
      .createHash('sha256')
      .update(this.serverSeed)
      .digest('hex');
    this.io.emit('round:state', {
      roundId: this.roundId,
      state: this.state,
      bank: this.getBank(),
      serverSeedHash: this.serverSeedHash,
    });
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
      this.io.emit('round:result', {
        roundId: this.roundId,
        winnerColor: null,
        payouts: [],
        serverSeed: this.serverSeed,
      });
      return this.startRound();
    }
    const rand =
      parseInt(
        crypto.createHash('sha256').update(this.serverSeed).digest('hex').slice(0, 8),
        16,
      ) / 0xffffffff;
    const pick = rand * total;
    const winnerColor = pick < bank.red ? 'red' : 'orange';
    const rake = total * this.config.RAKE;
    const payoutPool = total - rake;
    const winnerBank = bank[winnerColor];
    const mult = winnerBank > 0 ? payoutPool / winnerBank : 0;
    const payouts = this.bets[winnerColor].map((b) => ({
      userId: b.userId,
      amount: Math.floor(b.amount * mult * 100) / 100,
    }));
    let paid = payouts.reduce((s, p) => s + p.amount, 0);
    const remainder = +(payoutPool - paid).toFixed(2);
    if (remainder > 0 && payouts.length > 0) {
      payouts[payouts.length - 1].amount = +(payouts[payouts.length - 1].amount + remainder).toFixed(2);
      paid += remainder;
    }
    this.io.emit('round:result', {
      roundId: this.roundId,
      winnerColor,
      payouts,
      serverSeed: this.serverSeed,
    });
    this.betIds.clear();
    setTimeout(() => this.startRound(), 2000);
  }

  getBank() {
    return {
      red: this.bets.red.reduce((s, b) => s + b.amount, 0),
      orange: this.bets.orange.reduce((s, b) => s + b.amount, 0),
    };
  }

  placeBet(userId, color, amount, clientBetId) {
    if (this.state !== 'OPEN') throw new Error('bets_closed');
    if (!['red', 'orange'].includes(color)) throw new Error('invalid_color');
    const id = String(clientBetId || '');
    if (id && this.betIds.has(id)) {
      return; // идемпотентность
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) throw new Error('invalid_amount');
    if (amt < this.config.MIN_BET || amt > this.config.MAX_BET) throw new Error('invalid_amount');
    this.bets[color].push({ userId, amount: amt, clientBetId: id });
    if (id) {
      this.betIds.set(id, true);
      if (this.betIds.size > 1000) {
        const oldest = this.betIds.keys().next().value;
        this.betIds.delete(oldest);
      }
    }
    this.io.emit('bet:placed', {
      userId,
      color,
      amount: amt,
      roundId: this.roundId,
      bank: this.getBank(),
      clientBetId: id,
    });
  }
}

module.exports = JackpotWheel;
