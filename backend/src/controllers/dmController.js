import { directMessageService } from '../services/directMessageService.js';
import { pool } from '../config/database.js';

export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const companyId = req.user.company_id;

    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    // Verify both users are in same company
    const query = `SELECT * FROM users WHERE id = $1 AND company_id = $2`;
    const result = await pool.query(query, [userId, companyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const conversation = await directMessageService.getOrCreateConversation(
      currentUserId,
      userId,
      companyId
    );

    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Get or create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user.id;
    const companyId = req.user.company_id;

    if (!recipientId || !content.trim()) {
      return res.status(400).json({ error: 'Recipient and content required' });
    }

    const message = await directMessageService.sendMessage(
      senderId,
      recipientId,
      content,
      companyId
    );

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send DM error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const companyId = req.user.company_id;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await directMessageService.getConversationMessages(
      currentUserId,
      userId,
      companyId,
      limit,
      offset
    );

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

export const markConversationRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const companyId = req.user.company_id;

    await directMessageService.markConversationAsRead(
      currentUserId,
      userId,
      companyId
    );

    res.json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (error) {
    console.error('Mark conversation read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.company_id;

    const count = await directMessageService.getTotalUnreadCount(userId, companyId);

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.company_id;
    const { limit = 20, offset = 0 } = req.query;

    const conversations = await directMessageService.getUserConversations(
      userId,
      companyId,
      limit,
      offset
    );

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};

export const togglePinnedConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const companyId = req.user.company_id;

    const result = await directMessageService.togglePinnedConversation(
      currentUserId,
      userId,
      companyId
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({ error: 'Failed to toggle pin' });
  }
};

export const searchDirectMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { q } = req.query;
    const currentUserId = req.user.id;
    const companyId = req.user.company_id;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const results = await directMessageService.searchMessages(
      currentUserId,
      userId,
      q,
      companyId
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search DMs error:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const companyId = req.user.company_id;

    await directMessageService.deleteConversation(currentUserId, userId, companyId);

    res.json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};
