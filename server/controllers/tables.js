// Controller: tables (JS)
const Table = require('../models/Table');

exports.listTables = async (req, res) => {
  try {
    const userId = req.user && (req.user.id || req.user._id);
    const raw = await Table.find({}).lean();
    const tables = raw.map(t => ({
      ...t,
      id: String(t._id || t.id),
      canRejoin: t.status === 'playing' && Array.isArray(t.players) && t.players.some(p => {
        const pid = (p && (p.id || p._id)) ? String(p.id || p._id) : String(p);
        return userId && String(pid) == String(userId);
      }),
    }));
    res.json(tables);
  } catch (e) {
    console.error('listTables error', e);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

exports.joinTable = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user && (req.user.id || req.user._id);
    const table = await Table.findById(id);
    if (!table) return res.status(404).json({ error: 'TABLE_NOT_FOUND' });

    const isParticipant = Array.isArray(table.players) && table.players.some(p => {
      const pid = (p && (p.id || p._id)) ? String(p.id || p._id) : String(p);
      return userId && String(pid) === String(userId);
    });

    if (table.status === 'playing') {
      if (isParticipant) return res.json({ status: 'rejoin', tableId: String(table._id) });
      return res.status(403).json({ status: 'locked' });
    }

    if (!isParticipant && userId) {
      table.players.push(userId);
      await table.save();
    }
    res.json({ status: 'joined', tableId: String(table._id) });
  } catch (e) {
    console.error('joinTable error', e);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

exports.myActiveTable = async (req, res) => {
  try {
    const userId = req.user && (req.user.id || req.user._id);
    if (!userId) return res.json(null);
    const table = await Table.findOne({ status: 'playing', players: userId }).lean();
    if (!table) return res.json(null);
    res.json({ tableId: String(table._id), canRejoin: true });
  } catch (e) {
    console.error('myActiveTable error', e);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};
