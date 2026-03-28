import express from 'express';
import { analyticsController } from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRole } from '../middleware/authorization.js';

const router = express.Router();

// All analytics endpoints require authentication and manager+ role
router.use(authenticateToken);
router.use(authorizeRole(['admin', 'manager']));

/**
 * DASHBOARD & OVERVIEW
 */
router.get('/dashboard-kpis', (req, res) => 
  analyticsController.getDashboardKPIs(req, res));

router.get('/overview', (req, res) => 
  analyticsController.getCompanyOverview(req, res));

router.get('/executive-summary', (req, res) => 
  analyticsController.getExecutiveSummary(req, res));

/**
 * COMMUNICATION ANALYTICS
 */
router.get('/message-stats', (req, res) => 
  analyticsController.getMessageStats(req, res));

router.get('/channel-engagement', (req, res) => 
  analyticsController.getChannelEngagement(req, res));

router.get('/user-activity', (req, res) => 
  analyticsController.getUserActivity(req, res));

router.get('/message-trend', (req, res) => 
  analyticsController.getMessageTrend(req, res));

/**
 * INVENTORY ANALYTICS
 */
router.get('/inventory-stats', (req, res) => 
  analyticsController.getInventoryStats(req, res));

router.get('/inventory-movement', (req, res) => 
  analyticsController.getInventoryMovement(req, res));

router.get('/inventory-trend', (req, res) => 
  analyticsController.getInventoryTrend(req, res));

/**
 * EMPLOYEE & ATTENDANCE ANALYTICS
 */
router.get('/attendance-stats', (req, res) => 
  analyticsController.getAttendanceStats(req, res));

router.get('/attendance-trend', (req, res) => 
  analyticsController.getAttendanceTrend(req, res));

router.get('/employee-stats', (req, res) => 
  analyticsController.getEmployeeStats(req, res));

router.get('/department-performance', (req, res) => 
  analyticsController.getDepartmentPerformance(req, res));

/**
 * REPORTS & EXPORT
 */
router.get('/report', (req, res) => 
  analyticsController.generateReport(req, res));

router.get('/export', (req, res) => 
  analyticsController.exportReport(req, res));

export default router;
