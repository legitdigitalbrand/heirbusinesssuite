import pool from '../config/database.js';
import redis from '../config/redis.js';

class ChatService {
  /**
   * Create a new chat channel
   */
  async createChannel(companyId, channelName, departmentId, createdBy) {
    try {
      const query = `
        INSERT INTO chat_channels (company_id, name, department_id, created_by, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;
      const result = await pool.query(query, [companyId, channelName, departmentId, createdBy]);
      
      // Clear cache
      await redis.del(`channels:${companyId}`);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  }

  /**
   * Get all channels for a company
   */
  async getChannelsByCompany(companyId, userId) {
    try {
      // Check cache first
      const cacheKey = `channels:${companyId}`;
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const query = `
        SELECT c.*, 
               d.name as department_name,
               COUNT(m.id) as message_count,
               MAX(m.created_at) as last_message_at
        FROM chat_channels c
        LEFT JOIN departments d ON c.department_id = d.id
        LEFT JOIN messages m ON c.id = m.channel_id
        WHERE c.company_id = $1
        GROUP BY c.id, d.name
        ORDER BY c.created_at DESC
      `;
      const result = await pool.query(query, [companyId]);
      
      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(result.rows));
      
      return result.rows;
    } catch (error) {
      console.error('Error getting channels:', error);
      throw error;
    }
  }

  /**
   * Get channel by ID
   */
  async getChannelById(channelId, companyId) {
    try {
      const query = `
        SELECT c.*, 
               d.name as department_name,
               COUNT(m.id) as message_count
        FROM chat_channels c
        LEFT JOIN departments d ON c.department_id = d.id
        LEFT JOIN messages m ON c.id = m.channel_id
        WHERE c.id = $1 AND c.company_id = $2
        GROUP BY c.id, d.name
      `;
      const result = await pool.query(query, [channelId, companyId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting channel:', error);
      throw error;
    }
  }

  /**
   * Save message to database
   */
  async saveMessage(channelId, userId, content, fileUrls = null) {
    try {
      const query = `
        INSERT INTO messages (channel_id, user_id, content, file_urls, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING m.*,
          u.first_name, u.last_name, u.email,
          e.avatar_url
        FROM messages m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN employees e ON e.user_id = u.id
        WHERE m.id = $1
      `;
      const result = await pool.query(query, [
        channelId,
        userId,
        content,
        fileUrls ? JSON.stringify(fileUrls) : null
      ]);

      // Clear channel cache
      const channel = await this.getChannelById(channelId);
      if (channel) {
        await redis.del(`channels:${channel.company_id}`);
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a channel with pagination
   */
  async getChannelMessages(channelId, companyId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT m.*,
               u.first_name, u.last_name, u.email,
               e.avatar_url,
               COUNT(r.id) as reaction_count
        FROM messages m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN employees e ON e.user_id = u.id
        LEFT JOIN reactions r ON m.id = r.message_id
        WHERE m.channel_id = $1 
          AND m.company_id = $2
        GROUP BY m.id, u.id, e.id
        ORDER BY m.created_at DESC
        LIMIT $3 OFFSET $4
      `;
      const result = await pool.query(query, [channelId, companyId, limit, offset]);
      return result.rows.reverse(); // Reverse to get chronological order
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId, userId, companyId) {
    try {
      const query = `
        DELETE FROM messages
        WHERE id = $1 AND user_id = $2 AND company_id = $3
        RETURNING id
      `;
      const result = await pool.query(query, [messageId, userId, companyId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Update message content
   */
  async updateMessage(messageId, userId, content, companyId) {
    try {
      const query = `
        UPDATE messages
        SET content = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3 AND company_id = $4
        RETURNING *
      `;
      const result = await pool.query(query, [content, messageId, userId, companyId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }

  /**
   * Add reaction to message
   */
  async addReaction(messageId, userId, emoji, companyId) {
    try {
      const query = `
        INSERT INTO reactions (message_id, user_id, emoji, company_id, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (message_id, user_id, emoji, company_id) DO NOTHING
        RETURNING *
      `;
      const result = await pool.query(query, [messageId, userId, emoji, companyId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId, userId, emoji, companyId) {
    try {
      const query = `
        DELETE FROM reactions
        WHERE message_id = $1 AND user_id = $2 AND emoji = $3 AND company_id = $4
        RETURNING id
      `;
      const result = await pool.query(query, [messageId, userId, emoji, companyId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  /**
   * Get user's conversations (direct messages)
   */
  async getUserConversations(userId, companyId) {
    try {
      const query = `
        SELECT DISTINCT 
               CASE WHEN dm.sender_id = $1 THEN dm.recipient_id ELSE dm.sender_id END as other_user_id,
               u.first_name, u.last_name, u.email,
               e.avatar_url,
               MAX(dm.created_at) as last_message_at,
               (SELECT content FROM direct_messages 
                WHERE (sender_id = $1 AND recipient_id = u.id) 
                   OR (sender_id = u.id AND recipient_id = $1)
                ORDER BY created_at DESC LIMIT 1) as last_message
        FROM direct_messages dm
        JOIN users u ON (dm.sender_id = u.id OR dm.recipient_id = u.id)
        LEFT JOIN employees e ON e.user_id = u.id
        WHERE (dm.sender_id = $1 OR dm.recipient_id = $1)
          AND dm.company_id = $2
          AND u.id != $1
        GROUP BY other_user_id, u.id, e.id
        ORDER BY last_message_at DESC
      `;
      const result = await pool.query(query, [userId, companyId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  /**
   * Save direct message
   */
  async saveDirectMessage(senderId, recipientId, content, companyId) {
    try {
      const query = `
        INSERT INTO direct_messages (sender_id, recipient_id, content, company_id, read_at)
        VALUES ($1, $2, $3, $4, NULL)
        RETURNING *
      `;
      const result = await pool.query(query, [senderId, recipientId, content, companyId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error saving direct message:', error);
      throw error;
    }
  }

  /**
   * Get direct messages between two users
   */
  async getDirectMessages(userId, otherUserId, companyId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT dm.*,
               CASE WHEN sender_id = $1 THEN 'sent' ELSE 'received' END as direction,
               u.first_name, u.last_name,
               e.avatar_url
        FROM direct_messages dm
        JOIN users u ON dm.sender_id = u.id
        LEFT JOIN employees e ON e.user_id = u.id
        WHERE ((dm.sender_id = $1 AND dm.recipient_id = $2)
               OR (dm.sender_id = $2 AND dm.recipient_id = $1))
          AND dm.company_id = $3
        ORDER BY dm.created_at DESC
        LIMIT $4 OFFSET $5
      `;
      const result = await pool.query(query, [userId, otherUserId, companyId, limit, offset]);
      return result.rows.reverse();
    } catch (error) {
      console.error('Error getting direct messages:', error);
      throw error;
    }
  }

  /**
   * Mark direct message as read
   */
  async markDirectMessageAsRead(messageId) {
    try {
      const query = `
        UPDATE direct_messages
        SET read_at = NOW()
        WHERE id = $1 AND read_at IS NULL
        RETURNING *
      `;
      const result = await pool.query(query, [messageId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId, companyId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM direct_messages
        WHERE recipient_id = $1 AND read_at IS NULL AND company_id = $2
      `;
      const result = await pool.query(query, [userId, companyId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Get typing indicator
   */
  async setTypingIndicator(channelId, userId, isTyping) {
    try {
      const key = `typing:${channelId}`;
      if (isTyping) {
        await redis.setex(`${key}:${userId}`, 5, '1');
      } else {
        await redis.del(`${key}:${userId}`);
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
      throw error;
    }
  }

  /**
   * Get who's typing in channel
   */
  async getTypingUsers(channelId) {
    try {
      const key = `typing:${channelId}`;
      const keys = await redis.keys(`${key}:*`);
      return keys.map(k => k.split(':').pop());
    } catch (error) {
      console.error('Error getting typing users:', error);
      throw error;
    }
  }

  /**
   * Add file to message (attachment)
   */
  async addFileAttachment(messageId, filename, fileUrl, fileSize, mimeType, uploadedBy) {
    try {
      const query = `
        INSERT INTO file_attachments (message_id, filename, file_url, file_size, mime_type, uploaded_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `;
      const result = await pool.query(query, [messageId, filename, fileUrl, fileSize, mimeType, uploadedBy]);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding file attachment:', error);
      throw error;
    }
  }

  /**
   * Get file attachments for message
   */
  async getFileAttachments(messageId) {
    try {
      const query = `
        SELECT * FROM file_attachments
        WHERE message_id = $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [messageId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting file attachments:', error);
      throw error;
    }
  }

  /**
   * Delete file attachment
   */
  async deleteFileAttachment(attachmentId, uploadedBy) {
    try {
      const query = `
        DELETE FROM file_attachments
        WHERE id = $1 AND uploaded_by = $2
        RETURNING file_url
      `;
      const result = await pool.query(query, [attachmentId, uploadedBy]);
      return result.rows[0]?.file_url || null;
    } catch (error) {
      console.error('Error deleting file attachment:', error);
      throw error;
    }
  }

  /**
   * Search messages in channel
   */
  async searchChannelMessages(channelId, searchTerm, companyId) {
    try {
      const query = `
        SELECT m.*,
               u.first_name, u.last_name,
               e.avatar_url
        FROM messages m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN employees e ON e.user_id = u.id
        WHERE m.channel_id = $1 
          AND m.company_id = $2
          AND m.content ILIKE '%' || $3 || '%'
        ORDER BY m.created_at DESC
        LIMIT 50
      `;
      const result = await pool.query(query, [channelId, companyId, searchTerm]);
      return result.rows;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  /**
   * Pin/unpin message
   */
  async togglePinnedMessage(messageId, channelId, isPinning) {
    try {
      const query = isPinning
        ? `UPDATE messages SET pinned = true, pinned_at = NOW() WHERE id = $1 RETURNING *`
        : `UPDATE messages SET pinned = false, pinned_at = NULL WHERE id = $1 RETURNING *`;
      
      const result = await pool.query(query, [messageId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error toggling pinned message:', error);
      throw error;
    }
  }

  /**
   * Get pinned messages in channel
   */
  async getPinnedMessages(channelId) {
    try {
      const query = `
        SELECT m.*,
               u.first_name, u.last_name,
               e.avatar_url
        FROM messages m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN employees e ON e.user_id = u.id
        WHERE m.channel_id = $1 AND m.pinned = true
        ORDER BY m.pinned_at DESC
      `;
      const result = await pool.query(query, [channelId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting pinned messages:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();
