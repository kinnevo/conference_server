import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import profileRoutes from './routes/profiles';
import areaRoutes from './routes/areas';
import adminRoutes from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { initializeSocket } from './socket';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CRITICAL: Railway assigns PORT dynamically - always use process.env.PORT
const PORT = process.env.PORT || 3001;

// Socket.IO setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint (Railway uses this)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Conference Registration System API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      profiles: '/api/profiles',
      areas: '/api/areas',
      admin: '/api/admin',
      health: '/health'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/admin', adminRoutes);

// Socket.IO initialization
initializeSocket(io);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server - CRITICAL: use httpServer.listen, not app.listen (for Socket.IO)
httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  Conference Registration System - Server API            ║
╟──────────────────────────────────────────────────────────╢
║  Server running on port: ${PORT.toString().padEnd(32)}║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(43)}║
║  Socket.IO: Enabled                                      ║
╚══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { io };
