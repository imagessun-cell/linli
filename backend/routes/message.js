const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const messages = await db.allSync(`
      SELECT m.*,
             fu.nickname as from_nickname, fu.avatar_url as from_avatar,
             tu.nickname as to_nickname, tu.avatar_url as to_avatar
      FROM t_message m
      JOIN t_user fu ON m.from_user_id = fu.id
      JOIN t_user tu ON m.to_user_id = tu.id
      WHERE m.to_user_id = ? OR m.from_user_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, req.user.id, parseInt(limit), offset]);

    const totalResult = await db.getSync(`
      SELECT COUNT(*) as count FROM t_message WHERE to_user_id = ? OR from_user_id = ?
    `, [req.user.id, req.user.id]);

    res.json({ code: 0, message: 'success', data: { messages, total: totalResult.count } });
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
    const message = await db.getSync('SELECT * FROM t_message WHERE id = ?', [result.lastInsertRowid]);

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${targetId}`).emit('new_message', message);
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
