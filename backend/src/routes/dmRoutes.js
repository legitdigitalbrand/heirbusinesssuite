import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as dmController from '../controllers/dmController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get or create conversation with user
router.post('/conversation/:userId', dmController.getOrCreateConversation);

// Send direct message
router.post('/send', dmController.sendDirectMessage);

// Get messages in conversation
router.get('/conversation/:userId/messages', dmController.getConversationMessages);

// Mark conversation as read
router.put('/conversation/:userId/read', dmController.markConversationRead);

// Get user's conversations list
router.get('/conversations', dmController.getUserConversations);

// Get total unread count
router.get('/unread/count', dmController.getUnreadCount);

// Toggle pin status
router.put('/conversation/:userId/pin', dmController.togglePinnedConversation);

// Search in conversation
router.get('/conversation/:userId/search', dmController.searchDirectMessages);

// Delete conversation
router.delete('/conversation/:userId', dmController.deleteConversation);

export default router;
