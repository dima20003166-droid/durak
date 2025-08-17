const test = require('node:test');
const assert = require('node:assert');
const { handlePlayerAction } = require('../gameLogic');

test('round ends immediately if defender has no cards', () => {
  const attacker = { socketId: 'a1', username: 'A', hand: [{ id: 1, suit: '♠', rank: '6' }] };
  const defender = { socketId: 'd1', username: 'D', hand: [] };
  const deck = Array.from({ length: 12 }, (_, i) => ({ id: i + 2, suit: '♠', rank: '7' }));
  const room = {
    players: [attacker, defender],
    gameState: {
      deck,
      trumpCard: { id: 3, suit: '♠', rank: 'A' },
      table: [],
      discardPile: [],
      attackerIndex: 0,
      defenderIndex: 1,
      mode: 'classic',
      trickLimit: 6,
      message: '',
      turnFinishedBy: [],
      turnEndsAt: Date.now(),
      isResolvingRound: false,
    },
    status: 'playing',
  };
  handlePlayerAction(room, 'a1', 'attack', { id: 1 });
  assert.strictEqual(room.gameState.attackerIndex, 1);
});
