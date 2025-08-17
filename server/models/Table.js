
const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  title: String,
  status: { type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

module.exports = mongoose.models.Table || mongoose.model('Table', TableSchema);
