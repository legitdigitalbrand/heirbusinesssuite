import express from 'express';
import * as chatController from '../controllers/chatController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

// Middleware
router.use(authenticate); // All routes require authentication

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    // Allowed MIME types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

/**
 * Channel Management Routes
 */

// Create channel (Admin or Manager only)
router.post('/channels', authorize(['Admin', 'Manager']), chatController.createChannel);

// Get all channels for company
router.get('/channels', chatController.getChannels);

// Get specific channel
router.get('/channels/:channelId', chatController.getChannel);

/**
 * Message Routes
 */

// Get messages in channel with pagination
router.get('/channels/:channelId/messages', chatController.getChannelMessages);

// Search messages in channel
router.get('/channels/:channelId/search', chatController.searchMessages);

// Get pinned messages in channel
router.get('/channels/:channelId/pinned', chatController.getPinnedMessages);

// Get typing users in channel
router.get('/channels/:channelId/typing', chatController.getTypingUsers);

/**
 * File Attachment Routes
 */

// Get file attachments for a message
router.get('/messages/:messageId/attachments', chatController.getFileAttachments);

// Upload file to message
router.post('/messages/:messageId/attachments', upload.single('file'), chatController.uploadFile);

// Delete file attachment
router.delete('/attachments/:attachmentId', chatController.deleteFileAttachment);

/**
 * Direct Message Routes
 */

// Get user's direct message conversations
router.get('/conversations', chatController.getConversations);

// Get direct messages with specific user
router.get('/conversations/:otherUserId', chatController.getDirectMessages);

// Get unread message count
router.get('/unread-count', chatController.getUnreadCount);

export default router;
