const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.get('/posts', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const posts = await db.allSync(`
      SELECT p.*, u.nickname, u.avatar_url
      FROM t_community_post p
      JOIN t_user u ON p.worker_id = u.id
      WHERE p.status = 0
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), offset]);

    const totalResult = await db.getSync('SELECT COUNT(*) as count FROM t_community_post WHERE status = 0');

    res.json({ code: 0, message: 'success', data: { posts, total: totalResult.count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/posts/:postId', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await db.getSync(`
      SELECT p.*, u.nickname, u.avatar_url
      FROM t_community_post p
      JOIN t_user u ON p.worker_id = u.id
      WHERE p.id = ?
    `, [postId]);

    if (!post) {
      return res.status(404).json({ code: 404, message: '动态不存在' });
    }

    res.json({ code: 0, message: 'success', data: post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/posts', authMiddleware, async (req, res) => {
  try {
    const { content_type = 1, content_text, voice_url, image_urls } = req.body;

    if (!content_text && !voice_url && !image_urls) {
      return res.status(400).json({ code: 400, message: '内容不能为空' });
    }

    const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ?', [req.user.id]);
    if (!worker) {
      return res.status(400).json({ code: 400, message: '您还不是服务者' });
    }

    const now = new Date().toISOString();
    const result = await db.runSync(`
      INSERT INTO t_community_post (worker_id, content_type, content_text, voice_url, image_urls, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [req.user.id, content_type, content_text, voice_url, image_urls, now]);

    const post = await db.getSync('SELECT * FROM t_community_post WHERE id = ?', [result.lastInsertRowid]);

    res.json({ code: 0, message: '发布成功', data: post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/posts/:postId/like', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    await db.runSync('UPDATE t_community_post SET like_count = like_count + 1 WHERE id = ?', [postId]);
    res.json({ code: 0, message: '点赞成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/my-posts', authMiddleware, async (req, res) => {
  try {
    const posts = await db.allSync(`
      SELECT * FROM t_community_post WHERE worker_id = ? ORDER BY created_at DESC
    `, [req.user.id]);
    res.json({ code: 0, message: 'success', data: posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
