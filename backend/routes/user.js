const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.get('/profile/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await db.getSync('SELECT id, phone, nickname, avatar_url, role FROM t_user WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    res.json({ code: 0, message: 'success', data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await db.getSync('SELECT * FROM t_user WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    delete user.id_card;
    res.json({ code: 0, message: 'success', data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, avatar_url } = req.body;
    const now = new Date().toISOString();
    await db.runSync('UPDATE t_user SET nickname = ?, avatar_url = ?, updated_at = ? WHERE id = ?', [nickname, avatar_url, now, req.user.id]);
    const user = await db.getSync('SELECT * FROM t_user WHERE id = ?', [req.user.id]);
    res.json({ code: 0, message: '更新成功', data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
