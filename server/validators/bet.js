const { MIN_BET, MAX_BET, STEP } = require('../config/bets');
function normalizeBet(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return NaN;
  return Math.floor(n / STEP) * STEP;
}
function validateBet(rawBet, userBalance) {
  const bet = normalizeBet(rawBet);
  if (!Number.isFinite(bet) || bet <= 0) return { ok: false, code: 'ERR_BET_NOT_NUMBER', msg: 'Ставка должна быть числом больше 0.' };
  if (bet < MIN_BET) return { ok: false, code: 'ERR_BET_TOO_SMALL', msg: `Минимальная ставка: ${MIN_BET}.` };
  if (bet > MAX_BET) return { ok: false, code: 'ERR_BET_TOO_BIG', msg: `Максимальная ставка: ${MAX_BET}.` };
  if (bet > (userBalance ?? 0)) return { ok: false, code: 'ERR_BET_EXCEEDS_BALANCE', msg: 'Ставка превышает ваш баланс.' };
  return { ok: true, bet };
}
module.exports = { validateBet };
