const { Server } = require('socket.io');

const rooms = {};

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('✅ New client connected:', socket.id);

    // Create room
    socket.on('createRoom', ({ timer }) => {
      const roomId = Math.random().toString(36).substring(2, 8);
      rooms[roomId] = { players: [socket.id], timer };
      socket.join(roomId);
      socket.emit('roomCreated', { roomId });
      console.log(`🆕 Room created: ${roomId} by ${socket.id} with timer ${timer}`);
    });

    // Join room
    socket.on('joinRoom', ({ roomId, timer }) => {
  console.log(`🔍 Client ${socket.id} is trying to join room: ${roomId}`);
  const room = rooms[roomId];

  if (!room) {
    console.log(`❌ Room ${roomId} not found`);
    socket.emit('errorMessage', 'Room not found');
    return;
  }

  if (room.players.length >= 2) {
    console.log(`❌ Room ${roomId} is full`);
    socket.emit('errorMessage', 'Room is full');
    return;
  }

  room.players.push(socket.id);
  room.timer = timer; // ✅ This is the fix
  socket.join(roomId);

  console.log(`✅ Client ${socket.id} joined room: ${roomId}`);
  const [white, black] = room.players;
  io.to(white).emit('joinedRoom', { roomId, color: 'white' });
  io.to(black).emit('joinedRoom', { roomId, color: 'black' });

  io.to(roomId).emit('startGame', { timer }); // use updated timer
});


    // Handle moves
    socket.on('move', ({ roomId, move }) => {
      socket.to(roomId).emit('opponentMove', move);
    });

    // Handle chat messages
    socket.on('chatMessage', ({ roomId, message }) => {
      io.to(roomId).emit('chatMessage', {
        sender: socket.id,
        message,
      });
    });

    // Handle game over
    socket.on('gameOver', ({ roomId, message }) => {
      io.to(roomId).emit('gameOver', message);
    });

    // Handle rematch request
    socket.on('rematchRequest', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || !room.players.includes(socket.id)) return;

      const opponentId = room.players.find((id) => id !== socket.id);
      if (opponentId) {
        io.to(opponentId).emit('rematchPopup');
      }
    });

    // Opponent accepts rematch
    socket.on('acceptRematch', ({ roomId }) => {
      const room = rooms[roomId];
      if (room) {
        io.to(roomId).emit('rematchStart');
      }
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);

      for (const roomId in rooms) {
        const room = rooms[roomId];
        if (room.players.includes(socket.id)) {
          room.players = room.players.filter((id) => id !== socket.id);
          if (room.players.length === 0) {
            delete rooms[roomId];
            console.log(`🗑️ Room deleted: ${roomId}`);
          }
        }
      }
    });
  });
};

module.exports = setupSocket;
