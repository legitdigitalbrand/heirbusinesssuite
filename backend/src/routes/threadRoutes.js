import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as threadController from '../controllers/threadController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create thread reply
router.post('/', threadController.createThread);

// Get threads for a message
router.get('/message/:messageId', threadController.getThreads);

// Get thread count for a message
router.get('/message/:messageId/count', threadController.getThreadCount);

// Get thread details
router.get('/message/:messageId/details', threadController.getThreadDetails);

// Edit thread
router.put('/:threadId', threadController.editThread);

// Delete thread
router.delete('/:threadId', threadController.deleteThread);

// Add reaction to thread
router.post('/:threadId/reactions', threadController.addThreadReaction);

// Search threads in channel
router.get('/channel/:channelId/search', threadController.searchThreads);

export default router;
