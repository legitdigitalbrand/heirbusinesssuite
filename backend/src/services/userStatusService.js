import pool from '../config/database.js';
import redis from '../config/redis.js';

class UserStatusService {
  /**
   * Set user online status
   */
  async setUserStatus(userId, companyId, status = 'online') {
    try {
      const statusKey = `user:status:${userId}`;
      const companyKey = `company:online-users:${companyId}`;

      // Store user status in Redis with 30-minute expiration
      await redis.setex(statusKey, 1800, status);

      // Add to company's online users set
      await redis.sadd(companyKey, userId);

      // Also update last_seen in database
      const query = `
        UPDATE users
        SET last_seen_at = NOW(), status = $1
        WHERE id = $2
        RETURNING id, status, last_seen_at
      `;
      const result = await pool.query(query, [status, userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error setting user status:', error);
      throw error;
    }
  }

  /**
   * Get user status
   */
  async getUserStatus(userId) {
    try {
      const statusKey = `user:status:${userId}`;
      const status = await redis.get(statusKey) || 'offline';
      return status;
    } catch (error) {
      console.error('Error getting user status:', error);
      return 'offline';
    }
  }

  /**
   * Get all online users in company
   */
  async getOnlineUsers(companyId) {
    try {
      const companyKey = `company:online-users:${companyId}`;
      const userIds = await redis.smembers(companyKey);

      if (userIds.length === 0) return [];

      // Get user details
      const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
      const query = `
        SELECT u.id, u.first_name, u.last_name, u.email,
               e.avatar_url, e.department_id,
               d.name as department_name
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE u.id = ANY(ARRAY[${placeholders}]::uuid[])
      `;
      const result = await pool.query(query, userIds);

      // Add status for each user
      const usersWithStatus = await Promise.all(
        result.rows.map(async (user) => ({
          ...user,
          status: await this.getUserStatus(user.id)
        }))
      );

      return usersWithStatus;
    } catch (error) {
      console.error('Error getting online users:', error);
      throw error;
    }
  }

  /**
   * Set user offline
   */
  async setUserOffline(userId) {
    try {
      const statusKey = `user:status:${userId}`;
      await redis.del(statusKey);

      // Update database
      const query = `
        UPDATE users
        SET status = 'offline', last_seen_at = NOW()
        WHERE id = $1
        RETURNING id, status
      `;
      const result = await pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error setting user offline:', error);
      throw error;
    }
  }

  /**
   * Get offline/online timestamp
   */
  async getLastSeen(userId) {
    try {
      const query = `
        SELECT last_seen_at FROM users WHERE id = $1
      `;
      const result = await pool.query(query, [userId]);
      return result.rows[0]?.last_seen_at || null;
    } catch (error) {
      console.error('Error getting last seen:', error);
      throw error;
    }
  }

  /**
   * Update user presence in real-time
   */
  async updatePresence(userId, companyId, isActive = true) {
    try {
      const status = isActive ? 'active' : 'idle';
      const activityKey = `user:activity:${userId}`;

      if (isActive) {
        await redis.setex(activityKey, 300, 'active'); // 5 min timeout
        await this.setUserStatus(userId, companyId, 'online');
      } else {
        await redis.del(activityKey);
      }

      return { userId, status, isActive };
    } catch (error) {
      console.error('Error updating presence:', error);
      throw error;
    }
  }

  /**
   * Check if user is active
   */
  async isUserActive(userId) {
    try {
      const activityKey = `user:activity:${userId}`;
      const isActive = await redis.exists(activityKey);
      return isActive === 1;
    } catch (error) {
      console.error('Error checking user activity:', error);
      return false;
    }
  }
}

export const userStatusService = new UserStatusService();
