import pool from '../config/database.js';
import redis from '../config/redis.js';

class DirectMessageService {
  /**
   * Start or get conversation with user
   */
  async getOrCreateConversation(userId1, userId2, companyId) {
    try {
      // Normalize user IDs (smaller ID first)
      const [minId, maxId] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

      const query = `
        WITH conv AS (
          SELECT id FROM conversations
          WHERE company_id = $1 
            AND ((user_id_1 = $2 AND user_id_2 = $3) OR (user_id_1 = $3 AND user_id_2 = $2))
          LIMIT 1
        )
        INSERT INTO conversations (company_id, user_id_1, user_id_2, created_at)
        SELECT $1, $2, $3, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM conv)
        ON CONFLICT DO NOTHING
        RETURNING id, user_id_1, user_id_2, created_at;
      `;

      let result = await pool.query(query, [companyId, minId, maxId]);

      // If insert didn't happen, fetch existing
      if (result.rows.length === 0) {
        const selectQuery = `
          SELECT id, user_id_1, user_id_2, created_at FROM conversations
          WHERE company_id = $1 
            AND ((user_id_1 = $2 AND user_id_2 = $3) OR (user_id_1 = $3 AND user_id_2 = $2))
          LIMIT 1
        `;
        result = await pool.query(selectQuery, [companyId, minId, maxId]);
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  }

  /**
   * Send direct message
   */
  async sendMessage(conversationId, senderId, content, companyId) {
    try {
      if (!content || content.trim().length === 0) {
        throw new Error('Message content cannot be empty');
      }

      const query = `
        INSERT INTO direct_messages (conversation_id, sender_id, content, company_id, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING dm.*,
          s.first_name as sender_first_name,
          s.last_name as sender_last_name,
          e.avatar_url
        FROM direct_messages dm
        JOIN users s ON dm.sender_id = s.id
        LEFT JOIN employees e ON e.user_id = s.id
        WHERE dm.id = (SELECT id FROM direct_messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1)
      `;

      const result = await pool.query(query, [conversationId, senderId, content, companyId]);
      
      // Clear conversation cache
      await redis.del(`conversation:${conversationId}`);

      return result.rows[0];
    } catch (error) {
      console.error('Error sending DM:', error);
      throw error;
    }
  }

  /**
   * Get messages in conversation
   */
  async getConversationMessages(conversationId, companyId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT dm.*,
               s.first_name as sender_first_name,
               s.last_name as sender_last_name,
               s.email as sender_email,
               e.avatar_url
        FROM direct_messages dm
        JOIN users s ON dm.sender_id = s.id
        LEFT JOIN employees e ON e.user_id = s.id
        WHERE dm.conversation_id = $1 AND dm.company_id = $2
        ORDER BY dm.created_at DESC
        LIMIT $3 OFFSET $4
      `;
      const result = await pool.query(query, [conversationId, companyId, limit, offset]);
      return result.rows.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markConversationAsRead(conversationId, userId) {
    try {
      const query = `
        UPDATE direct_messages
        SET read_at = NOW()
        WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL
        RETURNING id
      `;
      const result = await pool.query(query, [conversationId, userId]);
      return result.rows.length;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Get unread count for specific conversation
   */
  async getUnreadCount(conversationId, userId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM direct_messages
        WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL
      `;
      const result = await pool.query(query, [conversationId, userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Get all conversations for user
   */
  async getUserConversations(userId, companyId) {
    try {
      const query = `
        SELECT c.id,
               CASE WHEN c.user_id_1 = $1 THEN c.user_id_2 ELSE c.user_id_1 END as other_user_id,
               u.first_name, u.last_name, u.email,
               e.avatar_url,
               (SELECT status FROM users WHERE id = u.id) as status,
               MAX(dm.created_at) as last_message_at,
               (SELECT content FROM direct_messages 
                WHERE conversation_id = c.id 
                ORDER BY created_at DESC LIMIT 1) as last_message,
               (SELECT COUNT(*) FROM direct_messages 
                WHERE conversation_id = c.id 
                AND sender_id != $1 
                AND read_at IS NULL) as unread_count
        FROM conversations c
        JOIN users u ON (c.user_id_1 = u.id OR c.user_id_2 = u.id)
        LEFT JOIN employees e ON e.user_id = u.id
        LEFT JOIN direct_messages dm ON c.id = dm.conversation_id
        WHERE c.company_id = $2 AND (c.user_id_1 = $1 OR c.user_id_2 = $1)
        GROUP BY c.id, u.id, e.id
        ORDER BY last_message_at DESC
      `;
      const result = await pool.query(query, [userId, companyId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  /**
   * Delete conversation for user
   */
  async deleteConversation(conversationId, userId) {
    try {
      // Just soft delete by removing user's messages
      const query = `
        DELETE FROM direct_messages
        WHERE conversation_id = $1 AND sender_id = $2
        RETURNING id
      `;
      const result = await pool.query(query, [conversationId, userId]);
      return result.rows.length;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  /**
   * Search DM messages
   */
  async searchMessages(conversationId, searchTerm, companyId) {
    try {
      const query = `
        SELECT dm.*,
               s.first_name, s.last_name,
               e.avatar_url
        FROM direct_messages dm
        JOIN users s ON dm.sender_id = s.id
        LEFT JOIN employees e ON e.user_id = s.id
        WHERE dm.conversation_id = $1 
          AND dm.company_id = $2
          AND dm.content ILIKE '%' || $3 || '%'
        ORDER BY dm.created_at DESC
        LIMIT 50
      `;
      const result = await pool.query(query, [conversationId, companyId, searchTerm]);
      return result.rows;
    } catch (error) {
      console.error('Error searching DM messages:', error);
      throw error;
    }
  }

  /**
   * Get total unread count for user
   */
  async getTotalUnreadCount(userId, companyId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM direct_messages dm
        WHERE dm.company_id = $1
          AND dm.sender_id != $2
          AND read_at IS NULL
          AND dm.conversation_id IN (
            SELECT id FROM conversations
            WHERE (user_id_1 = $2 OR user_id_2 = $2) AND company_id = $1
          )
      `;
      const result = await pool.query(query, [companyId, userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting total unread count:', error);
      return 0;
    }
  }

  /**
   * Pin/unpin conversation
   */
  async togglePinnedConversation(conversationId, userId, isPinned) {
    try {
      const query = isPinned
        ? `UPDATE conversations SET pinned = true, pinned_at = NOW() WHERE id = $1 RETURNING *`
        : `UPDATE conversations SET pinned = false, pinned_at = NULL WHERE id = $1 RETURNING *`;

      const result = await pool.query(query, [conversationId]);
      
      // Clear cache
      await redis.del(`conversation:${conversationId}`);

      return result.rows[0];
    } catch (error) {
      console.error('Error toggling pinned conversation:', error);
      throw error;
    }
  }
}

export const directMessageService = new DirectMessageService();
