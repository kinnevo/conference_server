import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../services/authService';

export function initializeSocket(io: Server): void {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.data.userId = decoded.userId;
      socket.data.email = decoded.email;
      socket.data.isAdmin = decoded.isAdmin;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.data.userId} (${socket.data.email})`);

    // Join user's personal room
    socket.join(`user:${socket.data.userId}`);

    // Area events - broadcast to all connected users
    socket.on('area:created', (area) => {
      console.log('Area created event:', area);
      socket.broadcast.emit('area:created', area);
    });

    socket.on('area:updated', (area) => {
      console.log('Area updated event:', area);
      socket.broadcast.emit('area:updated', area);
    });

    socket.on('area:deleted', (areaId) => {
      console.log('Area deleted event:', areaId);
      socket.broadcast.emit('area:deleted', areaId);
    });

    // Profile events - could be used for admin dashboard real-time updates
    socket.on('profile:updated', (profile) => {
      console.log('Profile updated event:', profile);
      // Broadcast to admins only
      io.to('admin-room').emit('profile:updated', profile);
      // Also send to user's personal room
      io.to(`user:${profile.id}`).emit('profile:updated', profile);
    });

    // Admin-only room for real-time stats
    if (socket.data.isAdmin) {
      socket.join('admin-room');
      console.log(`Admin ${socket.data.email} joined admin room`);
    }

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.userId} (${socket.data.email})`);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Handle server-side errors
  io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err);
  });
}
