const test = require('node:test');
const assert = require('node:assert');
const Module = require('module');

process.env.FIREBASE_SERVICE_ACCOUNT = '{}';

const mockDb = {
  collection: () => ({
    doc: () => ({
      get: async () => ({ exists: false, data: () => ({ balance: 0 }) }),
      set: async () => {},
      update: async () => {}
    }),
    add: async () => {},
    orderBy: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) })
  }),
  batch: () => ({
    update: () => {},
    set: () => {},
    commit: async () => {}
  })
};

const adminMock = {
  initializeApp: () => {},
  credential: { cert: () => ({}) },
  firestore: () => mockDb
};
adminMock.firestore.FieldValue = { increment: (n) => ({ increment: n }) };
adminMock.firestore.Timestamp = { fromDate: (d) => d };

const originalLoad = Module._load;
Module._load = function (req, parent, isMain) {
  if (req === 'firebase-admin') return adminMock;
  return originalLoad(req, parent, isMain);
};

const { performSettlementAndCleanup } = require('../server');
Module._load = originalLoad;

test('performSettlementAndCleanup with missing user', async () => {
  const room = {
    id: 'r1',
    status: 'finished',
    players: [{ id: 'u1', socketId: 's1', username: 'U1', isBot: false }],
    gameState: { loser: { id: 'u1', socketId: 's1', username: 'U1', isBot: false } },
    bet: 10
  };
  await assert.doesNotReject(() => performSettlementAndCleanup(room));
});

setTimeout(() => process.exit(0), 0);
