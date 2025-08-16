const { EventEmitter } = require('events');
const crypto = require('crypto');
const admin = require('firebase-admin');

class JackpotWheel extends EventEmitter {
  constructor(io, db, emitToUser, config = {}, initialData = null) {
    super();
    this.io = io;
    this.db = db;
    this.emitToUser = emitToUser;
    this.config = Object.assign({
      ROUND_DURATION_MS: 30000,
      LOCK_MS: 2500,
      RAKE: 0.05,
      MIN_BET: 1,
      MAX_BET: 1000,
      SPIN_MS: 3000,
      SYNC_OFFSET_MS: 500,
      RESULT_DISPLAY_MS: 3000,
    }, config);
    if (this.config.LOCK_MS >= this.config.ROUND_DURATION_MS) {
      throw new Error('LOCK_MS must be less than ROUND_DURATION_MS');
    }
    this.openDuration = this.config.ROUND_DURATION_MS - this.config.LOCK_MS;
    this.roundId = 0;
    this.state = 'OPEN';
    this.bets = { red: [], orange: [] };
    this.betIds = new Map(); // clientBetId -> true
    this.serverSeed = '';
    this.serverSeedHash = '';
    this.round = {
      roundId: 0,
      phase: 'idle',
      startTime: 0,
      animationDuration: this.config.SPIN_MS,
      targetAngle: 0,
      result: null,
    };
    this.openTimer = this.lockTimer = this.spinTimer = null;
    this.openUntil = this.lockUntil = this.spinUntil = null;
    if (initialData) {
      this.roundId = initialData.roundId || 0;
      this.bets = initialData.bets || { red: [], orange: [] };
      this.serverSeed = initialData.serverSeed || '';
      this.serverSeedHash = initialData.serverSeedHash || '';
      this.state = 'OPEN';
      const bank = this.getBank();
      const hasRed = this.bets.red.length > 0;
      const hasOrange = this.bets.orange.length > 0;
      const openTime = this.openDuration;
      this.io.emit('jackpot:state', {
        ...this.getState(),
        bank,
        openMs: hasRed && hasOrange ? openTime : null,
        timeLeftMs: hasRed && hasOrange ? openTime : null,
      });
      if (hasRed && hasOrange) {
        this.openTimer = setTimeout(() => this.lockRound(), openTime);
        this.openUntil = Date.now() + openTime;
      }
    } else {
      this.startRound();
    }
  }

  startRound() {
    clearTimeout(this.openTimer);
    clearTimeout(this.lockTimer);
    clearTimeout(this.spinTimer);
    this.openTimer = this.lockTimer = this.spinTimer = null;
    this.openUntil = this.lockUntil = this.spinUntil = null;
    this.roundId += 1;
    this.state = 'OPEN';
    this.bets = { red: [], orange: [] };
    this.serverSeed = crypto.randomBytes(32).toString('hex');
    this.serverSeedHash = crypto
      .createHash('sha256')
      .update(this.serverSeed)
      .digest('hex');
    this.round = {
      roundId: this.roundId,
      phase: 'idle',
      startTime: 0,
      animationDuration: this.config.SPIN_MS,
      targetAngle: 0,
      result: null,
    };
    this.saveRoundState();
    this.io.emit('jackpot:state', this.getState());
  }

  lockRound() {
    this.state = 'LOCK';
    const bank = this.getBank();
    this.io.emit('jackpot:state', { ...this.getState(), bank });
    this.lockTimer = setTimeout(() => this.spinRound(), this.config.LOCK_MS);
    this.lockUntil = Date.now() + this.config.LOCK_MS;
  }

  spinRound() {
    this.state = 'SPIN';
    const bank = this.getBank();
    const total = bank.red + bank.orange;
    let winnerColor = null;
    let targetAngle = 0;
    if (total > 0) {
      const rand =
        parseInt(
          crypto.createHash('sha256').update(this.serverSeed).digest('hex').slice(0, 8),
          16,
        ) / 0x100000000;
      const pick = rand * total;
      winnerColor = pick < bank.red ? 'red' : 'orange';
      const redAngle = total ? (bank.red / total) * 360 : 180;
      targetAngle =
        winnerColor === 'red'
          ? redAngle / 2
          : redAngle + (360 - redAngle) / 2;
      this.round.result = { color: winnerColor, sectorIndex: winnerColor === 'red' ? 0 : 1 };
    }
    const startTime = Date.now() + this.config.SYNC_OFFSET_MS;
    this.spinUntil = startTime + this.config.SPIN_MS;
    this.round = {
      ...this.round,
      phase: 'spinning',
      startTime,
      animationDuration: this.config.SPIN_MS,
      targetAngle,
    };
    this.io.emit('jackpot:start', {
      roundId: this.roundId,
      startTime,
      animationDuration: this.config.SPIN_MS,
      targetAngle,
    });
    const delay = this.spinUntil - Date.now();
    this.spinTimer = setTimeout(() => this.resultRound(), delay);
  }

  async resultRound() {
    this.state = 'RESULT';
    const bank = this.getBank();
    const total = bank.red + bank.orange;
    let winnerColor = null;
    if (total > 0) {
      const rand =
        parseInt(
          crypto.createHash('sha256').update(this.serverSeed).digest('hex').slice(0, 8),
          16,
        ) / 0x100000000;
      const pick = rand * total;
      winnerColor = pick < bank.red ? 'red' : 'orange';
      const redAngle = total ? (bank.red / total) * 360 : 180;
      this.round.targetAngle =
        winnerColor === 'red'
          ? redAngle / 2
          : redAngle + (360 - redAngle) / 2;
      this.round.result = { color: winnerColor, sectorIndex: winnerColor === 'red' ? 0 : 1 };
    }
    if (total === 0 || !winnerColor) {
      this.round.phase = 'settled';
      this.betIds.clear();
      this.io.emit('jackpot:settled', {
        roundId: this.roundId,
        result: this.round.result || null,
        payouts: [],
        serverSeed: this.serverSeed,
      });
      this.startRound();
      return;
    }
    this.io.emit('jackpot:result', { roundId: this.roundId, result: this.round.result });
    const rake = total * this.config.RAKE;
    const payoutPool = total - rake;
    const winnerBank = bank[winnerColor];
    const mult = winnerBank > 0 ? payoutPool / winnerBank : 0;
    const payoutsRaw = this.bets[winnerColor].map((b) => {
      const raw = b.amount * mult;
      return { userId: b.userId, amount: Math.round(raw * 100) / 100, raw };
    });
    let paid = payoutsRaw.reduce((s, p) => s + p.amount, 0);
    let remainder = +(payoutPool - paid).toFixed(2);
    if (remainder !== 0 && payoutsRaw.length > 0) {
      let remCents = Math.round(remainder * 100);
      const sign = Math.sign(remCents);
      const order = payoutsRaw
        .map((p, idx) => ({ idx, diff: p.raw - p.amount }))
        .sort((a, b) => (sign > 0 ? b.diff - a.diff : a.diff - b.diff));
      for (const o of order) {
        if (remCents === 0) break;
        payoutsRaw[o.idx].amount = +(payoutsRaw[o.idx].amount + sign * 0.01).toFixed(2);
        remCents -= sign;
      }
    }
    const payouts = payoutsRaw.map(({ userId, amount }) => ({ userId, amount }));
    if (this.db && typeof this.db.collection === 'function') {
      const failed = [];
      for (const { userId, amount } of payouts) {
        try {
          const ref = this.db.collection('users').doc(userId);
          await ref.update({ balance: admin.firestore.FieldValue.increment(amount) });
          const snap = await ref.get();
          const bal = snap.exists ? snap.data().balance : null;
          this.emitToUser(userId, 'current_user_update', { balance: bal });
        } catch (e) {
          console.error('balance update error', userId, e);
          failed.push({ userId, amount });
        }
      }
      if (failed.length) {
        for (const f of failed) {
          try {
            const ref = this.db.collection('users').doc(f.userId);
            await ref.update({ balance: admin.firestore.FieldValue.increment(f.amount) });
            const snap = await ref.get();
            const bal = snap.exists ? snap.data().balance : null;
            this.emitToUser(f.userId, 'current_user_update', { balance: bal });
          } catch (e) {
            console.error('balance retry failed', f.userId, e);
            this.emitToUser(f.userId, 'balance_update_error', { amount: f.amount });
          }
        }
      }
    }
    this.saveRoundState({ winnerColor, payouts, serverSeed: this.serverSeed });
    this.round.phase = 'settled';
    this.io.emit('round:result', { winnerColor, payouts });
    this.io.emit('jackpot:settled', {
      roundId: this.roundId,
      result: this.round.result,
      payouts,
      serverSeed: this.serverSeed,
      bank,
    });
    this.betIds.clear();
    setTimeout(() => this.startRound(), this.config.RESULT_DISPLAY_MS);
  }

  getBank() {
    return {
      red: this.bets.red.reduce((s, b) => s + b.amount, 0),
      orange: this.bets.orange.reduce((s, b) => s + b.amount, 0),
    };
  }

  getTimeLeft() {
    const now = Date.now();
    if (this.state === 'OPEN' && this.openTimer) return Math.max(0, this.openUntil - now);
    if (this.state === 'LOCK' && this.lockTimer) return Math.max(0, this.lockUntil - now);
    if (this.state === 'SPIN' && this.spinTimer) return Math.max(0, this.spinUntil - now);
    return 0;
  }

  getState() {
    return {
      ...this.round,
      bank: this.getBank(),
      bets: this.bets,
    };
  }

  placeBet(userId, username, color, amount, clientBetId) {
    if (this.state !== 'OPEN') throw new Error('bets_closed');
    if (!['red', 'orange'].includes(color)) throw new Error('invalid_color');
    const id = String(clientBetId || '');
    if (id && this.betIds.has(id)) {
      throw new Error('duplicate_bet_id');
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) throw new Error('invalid_amount');
    if (amt < this.config.MIN_BET || amt > this.config.MAX_BET) throw new Error('invalid_amount');
    this.bets[color].push({ userId, username, amount: amt, clientBetId: id });
    if (id) {
      this.betIds.set(id, true);
      if (this.betIds.size > 1000) {
        const oldest = this.betIds.keys().next().value;
        this.betIds.delete(oldest);
      }
    }
    this.io.emit('bet:placed', {
      userId,
      username,
      color,
      amount: amt,
      roundId: this.roundId,
      bank: this.getBank(),
      clientBetId: id,
    });
    this.saveRoundState();
    if (!this.openTimer) {
      const hasRed = this.bets.red.length > 0;
      const hasOrange = this.bets.orange.length > 0;
      if (hasRed && hasOrange) {
        const openTime = this.openDuration;
        this.io.emit('jackpot:state', {
          ...this.getState(),
          bank: this.getBank(),
          openMs: openTime,
          timeLeftMs: openTime,
        });
        this.openTimer = setTimeout(() => this.lockRound(), openTime);
        this.openUntil = Date.now() + openTime;
      }
    }
  }

  async saveRoundState(extra = {}) {
    if (!this.db || typeof this.db.collection !== 'function') return;
    try {
      await this.db.collection('jackpotRounds').doc(String(this.roundId)).set({
        roundId: this.roundId,
        serverSeedHash: this.serverSeedHash,
        serverSeed: this.serverSeed,
        bets: this.bets,
        state: this.state,
        ...extra,
      }, { merge: true });
    } catch (e) {
      console.error('Ошибка сохранения раунда', e);
    }
  }
}

module.exports = JackpotWheel;
