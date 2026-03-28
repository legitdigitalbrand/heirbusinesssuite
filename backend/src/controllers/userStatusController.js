import { userStatusService } from '../services/userStatusService.js';
import { pool } from '../config/database.js';

export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.id;
    const companyId = req.user.company_id;

    if (!['online', 'away', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await userStatusService.setUserStatus(userId, companyId, status);

    res.json({
      success: true,
      message: 'Status updated',
      data: { status }
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

export const getUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const companyId = req.user.company_id;

    const status = await userStatusService.getUserStatus(userId);
    const lastSeen = await userStatusService.getLastSeen(userId);

    res.json({
      success: true,
      data: {
        userId,
        status: status || 'offline',
        lastSeen
      }
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
};

export const getOnlineUsers = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const onlineUsers = await userStatusService.getOnlineUsers(companyId);

    res.json({
      success: true,
      data: onlineUsers
    });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ error: 'Failed to get online users' });
  }
};

export const updateActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.company_id;

    // Update presence - extends TTL
    await userStatusService.updatePresence(userId, companyId);

    res.json({
      success: true,
      message: 'Activity recorded'
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
};

export const getCompanyStats = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const query = `
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_count,
        SUM(CASE WHEN status = 'away' THEN 1 ELSE 0 END) as away_count,
        SUM(CASE WHEN status = 'busy' THEN 1 ELSE 0 END) as busy_count
      FROM users
      WHERE company_id = $1
    `;

    const result = await pool.query(query, [companyId]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get company stats error:', error);
    res.status(500).json({ error: 'Failed to get company stats' });
  }
};
