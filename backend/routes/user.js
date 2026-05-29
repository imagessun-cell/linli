const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.get('/profile', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM t_user WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }
  delete user.id_card;
  res.json({ code: 0, message: 'success', data: user });
});

router.put('/profile', authMiddleware, (req, res) => {
  const { nickname, avatar_url } = req.body;
  const now = new Date().toISOString();
  db.prepare('UPDATE t_user SET nickname = ?, avatar_url = ?, updated_at = ? WHERE id = ?')
    .run(nickname, avatar_url, now, req.user.id);
  const user = db.prepare('SELECT * FROM t_user WHERE id = ?').get(req.user.id);
  res.json({ code: 0, message: '更新成功', data: user });
});

module.exports = router;