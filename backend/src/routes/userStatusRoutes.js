import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as userStatusController from '../controllers/userStatusController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Update current user's status
router.put('/update', userStatusController.updateUserStatus);

// Get specific user's status
router.get('/:userId', userStatusController.getUserStatus);

// Get all online users in company
router.get('/company/online-users', userStatusController.getOnlineUsers);

// Record user activity (extends online status TTL)
router.post('/activity', userStatusController.updateActivity);

// Get company stats
router.get('/company/stats', userStatusController.getCompanyStats);

export default router;
