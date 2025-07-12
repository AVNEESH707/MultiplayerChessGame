const Game = require('../models/Game');
const { v4: uuidv4 } = require('uuid');

const createGame = async () => {
  const roomId = uuidv4();
  const newGame = new Game({ roomId, players: [] });
  await newGame.save();
  return roomId;
};

const joinGame = async (roomId, socketId) => {
  const game = await Game.findOne({ roomId });
  if (!game || game.players.length >= 2) return null;

  const color = game.players.length === 0 ? 'white' : 'black';
  game.players.push({ socketId, color });
  await game.save();
  return { game, color };
};

module.exports = {
  createGame,
  joinGame,
};
