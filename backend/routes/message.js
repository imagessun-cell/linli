const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.get('/list', authMiddleware, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const messages = db.prepare(`
    SELECT m.*,
           fu.nickname as from_nickname, fu.avatar_url as from_avatar,
           tu.nickname as to_nickname, tu.avatar_url as to_avatar
    FROM t_message m
    JOIN t_user fu ON m.from_user_id = fu.id
    JOIN t_user tu ON m.to_user_id = tu.id
    WHERE m.to_user_id = ? OR m.from_user_id = ?
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, req.user.id, limit, offset);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM t_message WHERE to_user_id = ? OR from_user_id = ?
  `).get(req.user.id, req.user.id).count;

  res.json({ code: 0, message: 'success', data: { messages, total } });
});

router.get('/conversation/:targetUserId', authMiddleware, (req, res) => {
  const { targetUserId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const messages = db.prepare(`
    SELECT m.*,
           fu.nickname as from_nickname, fu.avatar_url as from_avatar
    FROM t_message m
    JOIN t_user fu ON m.from_user_id = fu.id
    WHERE (m.from_user_id = ? AND m.to_user_id = ?) OR (m.from_user_id = ? AND m.to_user_id = ?)
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, targetUserId, targetUserId, req.user.id, limit, offset);

  db.prepare('UPDATE t_message SET is_read = 1 WHERE from_user_id = ? AND to_user_id = ?')
    .run(targetUserId, req.user.id);

  res.json({ code: 0, message: 'success', data: messages.reverse() });
});

router.post('/send', authMiddleware, (req, res) => {
  const { to_user_id, content, type = 1 } = req.body;

  if (!to_user_id || !content) {
    return res.status(400).json({ code: 400, message: '缺少必要参数' });
  }

  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO t_message (from_user_id, to_user_id, content, type, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, to_user_id, content, type, now);

  const message = db.prepare('SELECT * FROM t_message WHERE id = ?').get(result.lastInsertRowid);

  const io = req.app.get('io');
  if (io) {
    io.to(`user_${to_user_id}`).emit('message', message);
  }

  res.json({ code: 0, message: '发送成功', data: message });
});

router.get('/unread-count', authMiddleware, (req, res) => {
  const result = db.prepare('SELECT COUNT(*) as count FROM t_message WHERE to_user_id = ? AND is_read = 0')
    .get(req.user.id);

  res.json({ code: 0, message: 'success', data: { count: result.count } });
});

module.exports = router;