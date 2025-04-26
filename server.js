import { createServer } from 'http';
import { Server } from 'socket.io';

// Configuration
const PORT = process.env.PORT || 3000;

// Create HTTP Server
const server = createServer();

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware: Attach user information
io.use((socket, next) => {
  const { callerId } = socket.handshake.query || {};
  if (!callerId) {
    return next(new Error('callerId is required'));
  }
  socket.userId = callerId;
  next();
});

// Event Handlers
io.on('connection', (socket) => {
  console.log(`${socket.userId} connected`);
  
  socket.join(socket.userId);

  socket.on('makeCall', ({ calleeId, sdpOffer }) => {
    io.to(calleeId).emit('newCall', {
      callerId: socket.userId,
      sdpOffer,
    });
  });

  socket.on('answerCall', ({ callerId, sdpAnswer }) => {
    io.to(callerId).emit('callAnswered', {
      calleeId: socket.userId,
      sdpAnswer,
    });
  });

  socket.on('IceCandidate', ({ calleeId, iceCandidate }) => {
    io.to(calleeId).emit('IceCandidate', {
      senderId: socket.userId,
      iceCandidate,
    });
  });

  socket.on('disconnect', () => {
    console.log(`${socket.userId} disconnected`);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
