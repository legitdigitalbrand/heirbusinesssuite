import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as employeeController from '../controllers/employeeController.js';
import * as attendanceController from '../controllers/employeeController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Attendance routes
router.post('/attendance/sign-in', attendanceController.signIn);
router.post('/attendance/sign-out', attendanceController.signOut);
router.get('/attendance/today', attendanceController.getTodayStatus);
router.get('/attendance/history', attendanceController.getAttendanceHistory);
router.get('/dashboard', attendanceController.getDashboardData);
router.get('/profile', attendanceController.getEmployeeProfile);
router.put('/profile', attendanceController.updateEmployeeProfile);

// HR Management routes (Admin only)
router.post('/employees/invite', authorize(['Admin']), employeeController.inviteEmployee);
router.get('/employees', authorize(['Admin', 'Manager']), employeeController.listEmployees);
router.get('/employees/:employeeId', authorize(['Admin', 'Manager', 'HR']), employeeController.getEmployee);

export default router;
