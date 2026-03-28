import * as attendanceService from '../services/attendanceService.js';
import * as employeeService from '../services/employeeService.js';

export const signIn = async (req, res) => {
  try {
    const { userId, companyId } = req.user;
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || '0.0.0.0';

    const result = await attendanceService.signIn(userId, companyId, ipAddress);

    res.json({
      message: 'Signed in successfully',
      data: result,
    });
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const signOut = async (req, res) => {
  try {
    const { userId, companyId } = req.user;

    const result = await attendanceService.signOut(userId, companyId);

    res.json({
      message: 'Signed out successfully',
      data: result,
    });
  } catch (error) {
    console.error('Sign-out error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getTodayStatus = async (req, res) => {
  try {
    const { userId, companyId } = req.user;

    const result = await attendanceService.getTodayStatus(userId, companyId);

    res.json({ data: result });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAttendanceHistory = async (req, res) => {
  try {
    const { userId, companyId } = req.user;
    const { days = 30 } = req.query;

    const result = await attendanceService.getAttendanceHistory(userId, companyId, parseInt(days));

    res.json({ data: result });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getEmployeeProfile = async (req, res) => {
  try {
    const { userId, companyId } = req.user;

    const result = await employeeService.getEmployeeProfile(userId, companyId);

    res.json({ data: result });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(404).json({ error: error.message });
  }
};

export const updateEmployeeProfile = async (req, res) => {
  try {
    const { userId, companyId } = req.user;

    const result = await employeeService.updateEmployeeProfile(userId, companyId, req.body);

    res.json({ message: 'Profile updated successfully', data: result });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const { userId, companyId } = req.user;

    const stats = await employeeService.getDashboardStats(companyId);
    const todayStatus = await attendanceService.getTodayStatus(userId, companyId);
    const profile = await employeeService.getEmployeeProfile(userId, companyId);

    res.json({
      data: {
        stats,
        todayStatus,
        profile,
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};
