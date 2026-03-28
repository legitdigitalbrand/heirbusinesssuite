const chatService = require('../services/chatService');
const pool = require('../config/database');

// Track connected users per channel
const userChannels = new Map(); // userId -> Set of channelIds
const channelConnections = new Map(); // channelId -> Set of socketIds

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a channel
    socket.on('join-channel', async (data) => {
      try {
        const { channelId, userId, companyId } = data;
        
        // Verify user has access to channel
        const channel = await chatService.getChannelById(channelId, companyId);
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        // Add user to channel tracking
        socket.join(`channel:${channelId}`);
        
        if (!userChannels.has(userId)) {
          userChannels.set(userId, new Set());
        }
        userChannels.get(userId).add(channelId);

        if (!channelConnections.has(channelId)) {
          channelConnections.set(channelId, new Set());
        }
        channelConnections.get(channelId).add(socket.id);

        // Notify others user joined
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

    // Leave a channel
    socket.on('leave-channel', (data) => {
      try {
        const { channelId, userId } = data;
        
        socket.leave(`channel:${channelId}`);
        
        if (userChannels.has(userId)) {
          userChannels.get(userId).delete(channelId);
        }
        
        if (channelConnections.has(channelId)) {
          channelConnections.get(channelId).delete(socket.id);
        }

        // Notify others user left
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

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { channelId, userId, content, fileUrls, companyId } = data;

        // Validate message content
        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        // Save message to database
        const message = await chatService.saveMessage(
          channelId,
          userId,
          content,
          fileUrls
        );

        // Broadcast message to channel
        io.to(`channel:${channelId}`).emit('new-message', {
          id: message.id,
          channelId,
          userId,
          userName: `${message.first_name} ${message.last_name}`,
          userEmail: message.email,
          avatar: message.avatar_url,
          content,
          fileUrls: fileUrls || [],
          createdAt: message.created_at,
          timestamp: new Date()
        });

        console.log(`Message sent in channel ${channelId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('user-typing', async (data) => {
      try {
        const { channelId, userId, isTyping } = data;
        
        await chatService.setTypingIndicator(channelId, userId, isTyping);
        
        // Broadcast typing status
        io.to(`channel:${channelId}`).emit('user-typing', {
          userId,
          isTyping,
          channelId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error updating typing status:', error);
      }
    });

    // Edit message
    socket.on('edit-message', async (data) => {
      try {
        const { messageId, userId, channelId, content, companyId } = data;

        const updatedMessage = await chatService.updateMessage(
          messageId,
          userId,
          content,
          companyId
        );

        if (updatedMessage) {
          io.to(`channel:${channelId}`).emit('message-edited', {
            messageId,
            content,
            updatedAt: updatedMessage.updated_at,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Delete message
    socket.on('delete-message', async (data) => {
      try {
        const { messageId, userId, channelId, companyId } = data;

        const deleted = await chatService.deleteMessage(messageId, userId, companyId);

        if (deleted) {
          io.to(`channel:${channelId}`).emit('message-deleted', {
            messageId,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // React to message
    socket.on('add-reaction', async (data) => {
      try {
        const { messageId, userId, emoji, channelId, companyId } = data;

        const reaction = await chatService.addReaction(messageId, userId, emoji, companyId);

        if (reaction) {
          io.to(`channel:${channelId}`).emit('reaction-added', {
            messageId,
            userId,
            emoji,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error adding reaction:', error);
      }
    });

    // Remove reaction
    socket.on('remove-reaction', async (data) => {
      try {
        const { messageId, userId, emoji, channelId, companyId } = data;

        const removed = await chatService.removeReaction(messageId, userId, emoji, companyId);

        if (removed) {
          io.to(`channel:${channelId}`).emit('reaction-removed', {
            messageId,
            userId,
            emoji,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error removing reaction:', error);
      }
    });

    // Direct message
    socket.on('send-dm', async (data) => {
      try {
        const { senderId, recipientId, content, companyId } = data;

        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        const message = await chatService.saveDirectMessage(
          senderId,
          recipientId,
          content,
          companyId
        );

        // Get sender details
        const userQuery = 'SELECT first_name, last_name, email FROM users WHERE id = $1';
        const userResult = await pool.query(userQuery, [senderId]);
        const sender = userResult.rows[0];

        // Send to recipient if online
        io.to(`user:${recipientId}`).emit('new-dm', {
          id: message.id,
          senderId,
          senderName: `${sender.first_name} ${sender.last_name}`,
          senderEmail: sender.email,
          content,
          createdAt: message.created_at,
          timestamp: new Date()
        });

        console.log(`DM sent from ${senderId} to ${recipientId}`);
      } catch (error) {
        console.error('Error sending DM:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Join personal room for DMs
    socket.on('join-user-room', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their personal room`);
    });

    // Pin message
    socket.on('pin-message', async (data) => {
      try {
        const { messageId, channelId, isPinning } = data;

        await chatService.togglePinnedMessage(messageId, channelId, isPinning);

        io.to(`channel:${channelId}`).emit('message-pinned', {
          messageId,
          isPinning,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error pinning message:', error);
      }
    });

    // File upload
    socket.on('file-upload', async (data) => {
      try {
        const { messageId, filename, fileUrl, fileSize, mimeType, uploadedBy, channelId } = data;

        const attachment = await chatService.addFileAttachment(
          messageId,
          filename,
          fileUrl,
          fileSize,
          mimeType,
          uploadedBy
        );

        io.to(`channel:${channelId}`).emit('file-attached', {
          messageId,
          attachment,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        socket.emit('error', { message: 'Failed to upload file' });
      }
    });

    // Get online users in channel
    socket.on('get-online-users', (channelId) => {
      const activeUsers = Array.from(channelConnections.get(channelId) || []).length;
      socket.emit('online-users-count', {
        channelId,
        count: activeUsers,
        timestamp: new Date()
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      // Clean up user channels
      for (const [userId, channels] of userChannels.entries()) {
        for (const channelId of channels) {
          if (channelConnections.has(channelId)) {
            channelConnections.get(channelId).delete(socket.id);
          }
        }
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};
