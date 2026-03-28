import pool from '../config/database.js';

class ThreadService {
  /**
   * Create a thread (reply to a message)
   */
  async createThread(messageId, userId, content, companyId) {
    try {
      // Get parent message
      const parentQuery = `
        SELECT id, channel_id FROM messages WHERE id = $1 AND company_id = $2
      `;
      const parentResult = await pool.query(parentQuery, [messageId, companyId]);
      
      if (parentResult.rows.length === 0) {
        throw new Error('Parent message not found');
      }

      const { channel_id } = parentResult.rows[0];

      // Create thread reply
      const query = `
        INSERT INTO message_threads (parent_message_id, user_id, content, channel_id, company_id, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING mt.*,
          u.first_name, u.last_name, u.email,
          e.avatar_url
        FROM message_threads mt
        JOIN users u ON mt.user_id = u.id
        LEFT JOIN employees e ON e.user_id = u.id
        WHERE mt.id = (SELECT id FROM message_threads WHERE parent_message_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1)
      `;
      const result = await pool.query(query, [messageId, userId, content, channel_id, companyId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }

  /**
   * Get all threads for a message
   */
  async getThreads(messageId, companyId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT mt.*,
               u.first_name, u.last_name, u.email,
               e.avatar_url,
               COUNT(r.id) as reaction_count
        FROM message_threads mt
        JOIN users u ON mt.user_id = u.id
        LEFT JOIN employees e ON e.user_id = u.id
        LEFT JOIN reactions r ON mt.id = r.message_id
        WHERE mt.parent_message_id = $1 AND mt.company_id = $2
        GROUP BY mt.id, u.id, e.id
        ORDER BY mt.created_at ASC
        LIMIT $3 OFFSET $4
      `;
      const result = await pool.query(query, [messageId, companyId, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('Error getting threads:', error);
      throw error;
    }
  }

  /**
   * Get thread count for message
   */
  async getThreadCount(messageId) {
    try {
      const query = `
        SELECT COUNT(*) as count FROM message_threads WHERE parent_message_id = $1
      `;
      const result = await pool.query(query, [messageId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting thread count:', error);
      return 0;
    }
  }

  /**
   * Edit thread reply
   */
  async editThread(threadId, userId, content, companyId) {
    try {
      const query = `
        UPDATE message_threads
        SET content = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3 AND company_id = $4
        RETURNING *
      `;
      const result = await pool.query(query, [content, threadId, userId, companyId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error editing thread:', error);
      throw error;
    }
  }

  /**
   * Delete thread reply
   */
  async deleteThread(threadId, userId, companyId) {
    try {
      const query = `
        DELETE FROM message_threads
        WHERE id = $1 AND user_id = $2 AND company_id = $3
        RETURNING id
      `;
      const result = await pool.query(query, [threadId, userId, companyId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting thread:', error);
      throw error;
    }
  }

  /**
   * Add reaction to thread reply
   */
  async addThreadReaction(threadId, userId, emoji, companyId) {
    try {
      const query = `
        INSERT INTO thread_reactions (thread_id, user_id, emoji, company_id, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (thread_id, user_id, emoji, company_id) DO NOTHING
        RETURNING *
      `;
      const result = await pool.query(query, [threadId, userId, emoji, companyId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error adding thread reaction:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from thread reply
   */
  async removeThreadReaction(threadId, userId, emoji, companyId) {
    try {
      const query = `
        DELETE FROM thread_reactions
        WHERE thread_id = $1 AND user_id = $2 AND emoji = $3 AND company_id = $4
        RETURNING id
      `;
      const result = await pool.query(query, [threadId, userId, emoji, companyId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error removing thread reaction:', error);
      throw error;
    }
  }

  /**
   * Get thread details with all replies
   */
  async getThreadDetails(messageId, companyId) {
    try {
      // Get parent message
      const parentQuery = `
        SELECT m.*,
               u.first_name, u.last_name, u.email,
               e.avatar_url,
               (SELECT COUNT(*) FROM message_threads WHERE parent_message_id = m.id) as reply_count,
               (SELECT MAX(created_at) FROM message_threads WHERE parent_message_id = m.id) as last_reply_at
        FROM messages m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN employees e ON e.user_id = u.id
        WHERE m.id = $1 AND m.company_id = $2
      `;
      const parentResult = await pool.query(parentQuery, [messageId, companyId]);
      
      if (parentResult.rows.length === 0) {
        return null;
      }

      const parentMessage = parentResult.rows[0];

      // Get all thread replies
      const repliesQuery = `
        SELECT mt.*,
               u.first_name, u.last_name, u.email,
               e.avatar_url
        FROM message_threads mt
        JOIN users u ON mt.user_id = u.id
        LEFT JOIN employees e ON e.user_id = u.id
        WHERE mt.parent_message_id = $1 AND mt.company_id = $2
        ORDER BY mt.created_at ASC
      `;
      const repliesResult = await pool.query(repliesQuery, [messageId, companyId]);

      return {
        parent: parentMessage,
        replies: repliesResult.rows,
        replyCount: repliesResult.rows.length
      };
    } catch (error) {
      console.error('Error getting thread details:', error);
      throw error;
    }
  }

  /**
   * Notify users in thread
   */
  async notifyThreadParticipants(messageId, threadId, userId, companyId) {
    try {
      // Get all users who participated in thread
      const query = `
        SELECT DISTINCT user_id FROM message_threads
        WHERE parent_message_id = $1 AND company_id = $2 AND user_id != $3
      `;
      const result = await pool.query(query, [messageId, companyId, userId]);
      return result.rows.map(r => r.user_id);
    } catch (error) {
      console.error('Error getting thread participants:', error);
      return [];
    }
  }

  /**
   * Search threads by content
   */
  async searchThreads(messageId, searchTerm, companyId) {
    try {
      const query = `
        SELECT mt.*,
               u.first_name, u.last_name,
               e.avatar_url
        FROM message_threads mt
        JOIN users u ON mt.user_id = u.id
        LEFT JOIN employees e ON e.user_id = u.id
        WHERE mt.parent_message_id = $1 
          AND mt.company_id = $2
          AND mt.content ILIKE '%' || $3 || '%'
        ORDER BY mt.created_at DESC
      `;
      const result = await pool.query(query, [messageId, companyId, searchTerm]);
      return result.rows;
    } catch (error) {
      console.error('Error searching threads:', error);
      throw error;
    }
  }
}

export const threadService = new ThreadService();
