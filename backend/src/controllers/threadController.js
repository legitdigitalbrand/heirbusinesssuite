import { threadService } from '../services/threadService.js';
import { pool } from '../config/database.js';

export const createThread = async (req, res) => {
  try {
    const { channelId, messageId, content } = req.body;
    const userId = req.user.id;
    const companyId = req.user.company_id;

    if (!messageId || !content.trim()) {
      return res.status(400).json({ error: 'Message ID and content required' });
    }

    const thread = await threadService.createThread(messageId, userId, content, companyId);

    res.status(201).json({
      success: true,
      message: 'Thread reply created',
      data: thread
    });
  } catch (error) {
    console.error('Create thread error:', error);
    res.status(500).json({ error: 'Failed to create thread reply' });
  }
};

export const getThreads = async (req, res) => {
  try {
    const { messageId } = req.params;
    const companyId = req.user.company_id;
    const { limit = 50, offset = 0 } = req.query;

    const threads = await threadService.getThreads(messageId, companyId, limit, offset);

    res.json({
      success: true,
      data: threads
    });
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({ error: 'Failed to get threads' });
  }
};

export const getThreadCount = async (req, res) => {
  try {
    const { messageId } = req.params;
    const companyId = req.user.company_id;

    const count = await threadService.getThreadCount(messageId, companyId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get thread count error:', error);
    res.status(500).json({ error: 'Failed to get thread count' });
  }
};

export const editThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const companyId = req.user.company_id;

    if (!content.trim()) {
      return res.status(400).json({ error: 'Content required' });
    }

    // Verify ownership
    const query = `SELECT * FROM message_threads WHERE id = $1 AND created_by = $2 AND company_id = $3`;
    const result = await pool.query(query, [threadId, userId, companyId]);

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to edit this thread' });
    }

    const thread = await threadService.editThread(threadId, content, companyId);

    res.json({
      success: true,
      message: 'Thread updated',
      data: thread
    });
  } catch (error) {
    console.error('Edit thread error:', error);
    res.status(500).json({ error: 'Failed to edit thread' });
  }
};

export const deleteThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.id;
    const companyId = req.user.company_id;

    // Verify ownership
    const query = `SELECT * FROM message_threads WHERE id = $1 AND created_by = $2 AND company_id = $3`;
    const result = await pool.query(query, [threadId, userId, companyId]);

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to delete this thread' });
    }

    await threadService.deleteThread(threadId, companyId);

    res.json({
      success: true,
      message: 'Thread deleted'
    });
  } catch (error) {
    console.error('Delete thread error:', error);
    res.status(500).json({ error: 'Failed to delete thread' });
  }
};

export const addThreadReaction = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;
    const companyId = req.user.company_id;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji required' });
    }

    const reaction = await threadService.addThreadReaction(threadId, userId, emoji, companyId);

    res.status(201).json({
      success: true,
      data: reaction
    });
  } catch (error) {
    console.error('Add thread reaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
};

export const searchThreads = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { q } = req.query;
    const companyId = req.user.company_id;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const results = await threadService.searchThreads(channelId, q, companyId);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search threads error:', error);
    res.status(500).json({ error: 'Failed to search threads' });
  }
};

export const getThreadDetails = async (req, res) => {
  try {
    const { messageId } = req.params;
    const companyId = req.user.company_id;

    const details = await threadService.getThreadDetails(messageId, companyId);

    res.json({
      success: true,
      data: details
    });
  } catch (error) {
    console.error('Get thread details error:', error);
    res.status(500).json({ error: 'Failed to get thread details' });
  }
};
