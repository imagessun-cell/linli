const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.get('/list', authMiddleware, async (req, res) => {
  try {
    const conversations = await db.allSync(`
      SELECT
        other.id as other_user_id,
        other.nickname as other_nickname,
        other.avatar_url as other_avatar,
        latest.content as last_message,
        latest.created_at as last_message_time,
        latest.type as last_message_type,
        COALESCE(unread.unread_count, 0) as unread_count
      FROM (
        SELECT DISTINCT
          CASE WHEN m.from_user_id = ? THEN m.to_user_id ELSE m.from_user_id END AS other_id
        FROM t_message m
        WHERE m.from_user_id = ? OR m.to_user_id = ?
      ) conv
      JOIN t_user other ON other.id = conv.other_id
      LEFT JOIN t_message latest ON latest.id = (
        SELECT m2.id FROM t_message m2
        WHERE (m2.from_user_id = ? AND m2.to_user_id = conv.other_id)
           OR (m2.from_user_id = conv.other_id AND m2.to_user_id = ?)
        ORDER BY m2.created_at DESC
        LIMIT 1
      )
      LEFT JOIN (
        SELECT from_user_id, COUNT(*) as unread_count
        FROM t_message
        WHERE to_user_id = ? AND is_read = 0
        GROUP BY from_user_id
      ) unread ON unread.from_user_id = conv.other_id
      ORDER BY latest.created_at DESC
    `, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);

    res.json({ code: 0, message: 'success', data: { conversations } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/conversation/:targetUserId', authMiddleware, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const messages = await db.allSync(`
      SELECT m.*,
             fu.nickname as from_nickname, fu.avatar_url as from_avatar
      FROM t_message m
      JOIN t_user fu ON m.from_user_id = fu.id
      WHERE (m.from_user_id = ? AND m.to_user_id = ?) OR (m.from_user_id = ? AND m.to_user_id = ?)
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, targetUserId, targetUserId, req.user.id, parseInt(limit), offset]);

    await db.runSync('UPDATE t_message SET is_read = 1 WHERE from_user_id = ? AND to_user_id = ?', [targetUserId, req.user.id]);

    res.json({ code: 0, message: 'success', data: messages.reverse() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { to_user_id, content, type = 1 } = req.body;

    const targetId = Number(to_user_id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ code: 400, message: 'to_user_id 无效' });
    }
    if (!content || !String(content).trim()) {
      return res.status(400).json({ code: 400, message: '消息内容不能为空' });
    }
    if (targetId === req.user.id) {
      return res.status(400).json({ code: 400, message: '不能给自己发消息' });
    }

    const targetUser = await db.getSync('SELECT id FROM t_user WHERE id = ?', [targetId]);
    if (!targetUser) {
      return res.status(400).json({ code: 400, message: '接收方用户不存在' });
    }

    const now = new Date().toISOString();
    const result = await db.runSync(`
      INSERT INTO t_message (from_user_id, to_user_id, content, type, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.id, targetId, String(content), type, now]);
    const message = await db.getSync(`
      SELECT m.*, u.nickname as from_nickname, u.avatar_url as from_avatar
      FROM t_message m
      JOIN t_user u ON m.from_user_id = u.id
      WHERE m.id = ?
    `, [result.lastInsertRowid]);

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${targetId}`).emit('new_message', message);
        io.to(`user_${req.user.id}`).emit('message_sent', message);
      }
    } catch (e) {
      console.error('socket emit error:', e);
    }

    res.json({ code: 0, message: 'success', data: message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const result = await db.getSync('SELECT COUNT(*) as count FROM t_message WHERE to_user_id = ? AND is_read = 0', [req.user.id]);
    res.json({ code: 0, message: 'success', data: { count: result.count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
