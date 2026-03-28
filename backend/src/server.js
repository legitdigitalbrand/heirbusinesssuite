import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import userStatusRoutes from './routes/userStatusRoutes.js';
import threadRoutes from './routes/threadRoutes.js';
import dmRoutes from './routes/dmRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authenticate } from './middleware/auth.js';
import { chatService } from './services/chatService.js';
import { threadService } from './services/threadService.js';
import { directMessageService } from './services/directMessageService.js';
import { userStatusService } from './services/userStatusService.js';
import { inventoryService } from './services/inventoryService.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
});

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/status', userStatusRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);

// Socket.IO setup with chat events
io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`);

  // Chat events
  socket.on('join-channel', async (data) => {
    try {
      const { channelId, userId, companyId } = data;
      socket.join(`channel:${channelId}`);
      io.to(`channel:${channelId}`).emit('user-joined', {
        userId,
        channelId,
        timestamp: new Date()
      });
      console.log(`User ${userId} joined channel ${channelId}`);
    } catch (error) {
      console.error('Error joining channel:', error);
      socket.emit('error', { message: 'Failed to join channel' });
    }
  });

  socket.on('leave-channel', (data) => {
    try {
      const { channelId, userId } = data;
      socket.leave(`channel:${channelId}`);
      io.to(`channel:${channelId}`).emit('user-left', {
        userId,
        channelId,
        timestamp: new Date()
      });
      console.log(`User ${userId} left channel ${channelId}`);
    } catch (error) {
      console.error('Error leaving channel:', error);
    }
  });

  socket.on('user-typing', (data) => {
    try {
      const { channelId, userId, isTyping } = data;
      io.to(`channel:${channelId}`).emit('user-typing', {
        userId,
        isTyping,
        channelId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error broadcasting typing event:', error);
    }
  });

  socket.on('send-message', async (data) => {
    try {
      const { channelId, userId, content, companyId } = data;
      const message = await chatService.saveMessage(channelId, userId, content, companyId);
      
      io.to(`channel:${channelId}`).emit('new-message', {
        id: message.id,
        channelId,
        userId,
        content,
        userName: data.userName || 'User',
        createdAt: new Date(),
        replyCount: 0
      });
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('send-thread-reply', async (data) => {
    try {
      const { parentMessageId, userId, content, companyId, channelId } = data;
      const thread = await threadService.createThread(parentMessageId, userId, content, companyId);
      
      io.to(`channel:${channelId}`).emit('thread-reply-added', {
        id: thread.id,
        parentMessageId,
        userId,
        content,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error sending thread reply:', error);
      socket.emit('error', { message: 'Failed to send reply' });
    }
  });

  socket.on('send-dm', async (data) => {
    try {
      const { senderId, recipientId, content, companyId } = data;
      const message = await directMessageService.sendMessage(
        senderId,
        recipientId,
        content,
        companyId
      );
      
      // Send to both sender and recipient rooms
      io.to(`user:${senderId}`).emit('new-dm', {
        id: message.id,
        senderId,
        recipientId,
        content,
        createdAt: new Date()
      });
      
      io.to(`user:${recipientId}`).emit('new-dm', {
        id: message.id,
        senderId,
        recipientId,
        content,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error sending DM:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('update-status', async (data) => {
    try {
      const { userId, companyId, status } = data;
      await userStatusService.setUserStatus(userId, companyId, status);
      
      io.emit('user-status-changed', {
        userId,
        status,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  });

  socket.on('join-user-room', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their personal room`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Make io accessible to routes
app.locals.io = io;

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default app;
