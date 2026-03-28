import express from 'express';
import { register, login, refresh, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register-company', register);
router.post('/login', login);
router.post('/refresh-token', refresh);
router.post('/logout', authenticate, logout);

export default router;
