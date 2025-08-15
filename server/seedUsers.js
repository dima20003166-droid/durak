// server/seedUsers.js
// Usage: node seedUsers.js
// Requires valid serviceAccountKey.json in the same folder.

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function seed() {
  const users = [
    { username: 'player', password: 'player', role: 'user', rating: 1000, balance: 1000, stats: { games: 0, wins: 0, losses: 0 }, isBanned: false },
    { username: 'admin',  password: 'admin',  role: 'admin', rating: 1500, balance: 5000, stats: { games: 0, wins: 0, losses: 0 }, isBanned: false },
    { username: 'moderator', password: 'moderator', role: 'moderator', rating: 1200, balance: 2000, stats: { games: 0, wins: 0, losses: 0 }, isBanned: false },
  ];
  for (const u of users) {
    const snap = await db.collection('users').where('username','==',u.username).get();
    if (snap.empty) {
      await db.collection('users').add(u);
      console.log('Created user:', u.username);
    } else {
      console.log('User exists:', u.username);
    }
  }
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });