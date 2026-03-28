import { chatService } from '../services/chatService.js';

/**
 * Create a new chat channel
 */
export const createChannel = async (req, res) => {
  try {
    const { name, departmentId } = req.body;
    const { user } = req;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    const channel = await chatService.createChannel(
      user.company_id,
      name,
      departmentId,
      user.id
    );

    res.status(201).json({
      success: true,
      data: channel,
      message: 'Channel created successfully'
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
};

/**
 * Get all channels for company
 */
export const getChannels = async (req, res) => {
  try {
    const { user } = req;

    const channels = await chatService.getChannelsByCompany(user.company_id, user.id);

    res.json({
      success: true,
      data: channels
    });
  } catch (error) {
    console.error('Error getting channels:', error);
    res.status(500).json({ error: 'Failed to get channels' });
  }
};

/**
 * Get channel by ID
 */
export const getChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { user } = req;

    const channel = await chatService.getChannelById(channelId, user.company_id);

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({
      success: true,
      data: channel
    });
  } catch (error) {
    console.error('Error getting channel:', error);
    res.status(500).json({ error: 'Failed to get channel' });
  }
};

/**
 * Get messages in a channel
 */
export const getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const { user } = req;

    const messages = await chatService.getChannelMessages(
      channelId,
      user.company_id,
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: messages,
      pagination: {
        limit,
        offset,
        total: messages.length
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

/**
 * Search messages in channel
 */
export const searchMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { q } = req.query;
    const { user } = req;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await chatService.searchChannelMessages(channelId, q, user.company_id);

    res.json({
      success: true,
      data: results,
      query: q
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
};

/**
 * Get pinned messages in channel
 */
export const getPinnedMessages = async (req, res) => {
  try {
    const { channelId } = req.params;

    const pinnedMessages = await chatService.getPinnedMessages(channelId);

    res.json({
      success: true,
      data: pinnedMessages
    });
  } catch (error) {
    console.error('Error getting pinned messages:', error);
    res.status(500).json({ error: 'Failed to get pinned messages' });
  }
};

/**
 * Get user's direct message conversations
 */
export const getConversations = async (req, res) => {
  try {
    const { user } = req;

    const conversations = await chatService.getUserConversations(user.id, user.company_id);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};

/**
 * Get direct messages between two users
 */
export const getDirectMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const { user } = req;

    const messages = await chatService.getDirectMessages(
      user.id,
      otherUserId,
      user.company_id,
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: messages,
      pagination: {
        limit,
        offset,
        total: messages.length
      }
    });
  } catch (error) {
    console.error('Error getting direct messages:', error);
    res.status(500).json({ error: 'Failed to get direct messages' });
  }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const { user } = req;

    const unreadCount = await chatService.getUnreadCount(user.id, user.company_id);

    res.json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

/**
 * Get file attachments for a message
 */
export const getFileAttachments = async (req, res) => {
  try {
    const { messageId } = req.params;

    const attachments = await chatService.getFileAttachments(messageId);

    res.json({
      success: true,
      data: attachments
    });
  } catch (error) {
    console.error('Error getting file attachments:', error);
    res.status(500).json({ error: 'Failed to get file attachments' });
  }
};

/**
 * Delete file attachment
 */
export const deleteFileAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const { user } = req;

    const fileUrl = await chatService.deleteFileAttachment(attachmentId, user.id);

    if (!fileUrl) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // TODO: Delete file from cloud storage (S3, etc.)

    res.json({
      success: true,
      message: 'File attachment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file attachment:', error);
    res.status(500).json({ error: 'Failed to delete file attachment' });
  }
};

/**
 * Upload file to channel message
 */
export const uploadFile = async (req, res) => {
  try {
    const { file } = req;
    const { messageId } = req.body;
    const { user } = req;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    // TODO: Upload file to S3 or cloud storage
    // For now, return placeholder fileUrl
    const fileUrl = `/uploads/${file.filename}`;

    const attachment = await chatService.addFileAttachment(
      messageId,
      file.originalname,
      fileUrl,
      file.size,
      file.mimetype,
      user.id
    );

    res.status(201).json({
      success: true,
      data: attachment,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

/**
 * Get typing users in channel
 */
export const getTypingUsers = async (req, res) => {
  try {
    const { channelId } = req.params;

    const typingUsers = await chatService.getTypingUsers(channelId);

    res.json({
      success: true,
      data: {
        channelId,
        typingUsers,
        count: typingUsers.length
      }
    });
  } catch (error) {
    console.error('Error getting typing users:', error);
    res.status(500).json({ error: 'Failed to get typing users' });
  }
};
  try {
    const { name, departmentId } = req.body;
    const { user } = req;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    const channel = await chatService.createChannel(
      user.company_id,
      name,
      departmentId,
      user.id
    );

    res.status(201).json({
      success: true,
      data: channel,
      message: 'Channel created successfully'
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
};

/**
 * Get all channels for company
 */
exports.getChannels = async (req, res) => {
  try {
    const { user } = req;

    const channels = await chatService.getChannelsByCompany(user.company_id, user.id);

    res.json({
      success: true,
      data: channels
    });
  } catch (error) {
    console.error('Error getting channels:', error);
    res.status(500).json({ error: 'Failed to get channels' });
  }
};

/**
 * Get channel by ID
 */
exports.getChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { user } = req;

    const channel = await chatService.getChannelById(channelId, user.company_id);

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({
      success: true,
      data: channel
    });
  } catch (error) {
    console.error('Error getting channel:', error);
    res.status(500).json({ error: 'Failed to get channel' });
  }
};

/**
 * Get messages in a channel
 */
exports.getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const { user } = req;

    const messages = await chatService.getChannelMessages(
      channelId,
      user.company_id,
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: messages,
      pagination: {
        limit,
        offset,
        total: messages.length
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

/**
 * Search messages in channel
 */
exports.searchMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { q } = req.query;
    const { user } = req;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await chatService.searchChannelMessages(channelId, q, user.company_id);

    res.json({
      success: true,
      data: results,
      query: q
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
};

/**
 * Get pinned messages in channel
 */
exports.getPinnedMessages = async (req, res) => {
  try {
    const { channelId } = req.params;

    const pinnedMessages = await chatService.getPinnedMessages(channelId);

    res.json({
      success: true,
      data: pinnedMessages
    });
  } catch (error) {
    console.error('Error getting pinned messages:', error);
    res.status(500).json({ error: 'Failed to get pinned messages' });
  }
};

/**
 * Get user's direct message conversations
 */
exports.getConversations = async (req, res) => {
  try {
    const { user } = req;

    const conversations = await chatService.getUserConversations(user.id, user.company_id);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};

/**
 * Get direct messages between two users
 */
exports.getDirectMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const { user } = req;

    const messages = await chatService.getDirectMessages(
      user.id,
      otherUserId,
      user.company_id,
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: messages,
      pagination: {
        limit,
        offset,
        total: messages.length
      }
    });
  } catch (error) {
    console.error('Error getting direct messages:', error);
    res.status(500).json({ error: 'Failed to get direct messages' });
  }
};

/**
 * Get unread message count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const { user } = req;

    const unreadCount = await chatService.getUnreadCount(user.id, user.company_id);

    res.json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

/**
 * Get file attachments for a message
 */
exports.getFileAttachments = async (req, res) => {
  try {
    const { messageId } = req.params;

    const attachments = await chatService.getFileAttachments(messageId);

    res.json({
      success: true,
      data: attachments
    });
  } catch (error) {
    console.error('Error getting file attachments:', error);
    res.status(500).json({ error: 'Failed to get file attachments' });
  }
};

/**
 * Delete file attachment
 */
exports.deleteFileAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const { user } = req;

    const fileUrl = await chatService.deleteFileAttachment(attachmentId, user.id);

    if (!fileUrl) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // TODO: Delete file from cloud storage (S3, etc.)

    res.json({
      success: true,
      message: 'File attachment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file attachment:', error);
    res.status(500).json({ error: 'Failed to delete file attachment' });
  }
};

/**
 * Upload file to channel message
 */
exports.uploadFile = async (req, res) => {
  try {
    const { file } = req;
    const { messageId } = req.body;
    const { user } = req;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    // TODO: Upload file to S3 or cloud storage
    // For now, return placeholder fileUrl
    const fileUrl = `/uploads/${file.filename}`;

    const attachment = await chatService.addFileAttachment(
      messageId,
      file.originalname,
      fileUrl,
      file.size,
      file.mimetype,
      user.id
    );

    res.status(201).json({
      success: true,
      data: attachment,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

/**
 * Get typing users in channel
 */
exports.getTypingUsers = async (req, res) => {
  try {
    const { channelId } = req.params;

    const typingUsers = await chatService.getTypingUsers(channelId);

    res.json({
      success: true,
      data: {
        channelId,
        typingUsers,
        count: typingUsers.length
      }
    });
  } catch (error) {
    console.error('Error getting typing users:', error);
    res.status(500).json({ error: 'Failed to get typing users' });
  }
};
