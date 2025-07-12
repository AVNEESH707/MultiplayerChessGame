const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  players: [{ socketId: String, color: String }],
  fen: { type: String, default: 'start' }, // starting position
  moves: [String],
  winner: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);
