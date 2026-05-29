const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.get('/posts', authMiddleware, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const posts = db.prepare(`
    SELECT p.*, u.nickname, u.avatar_url
    FROM t_community_post p
    JOIN t_user u ON p.worker_id = u.id
    WHERE p.status = 0
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM t_community_post WHERE status = 0').get().count;

  res.json({ code: 0, message: 'success', data: { posts, total } });
});

router.get('/posts/:postId', authMiddleware, (req, res) => {
  const { postId } = req.params;

  const post = db.prepare(`
    SELECT p.*, u.nickname, u.avatar_url
    FROM t_community_post p
    JOIN t_user u ON p.worker_id = u.id
    WHERE p.id = ?
  `).get(postId);

  if (!post) {
    return res.status(404).json({ code: 404, message: '动态不存在' });
  }

  res.json({ code: 0, message: 'success', data: post });
});

router.post('/posts', authMiddleware, (req, res) => {
  const { content_type = 1, content_text, voice_url, image_urls } = req.body;

  if (!content_text && !voice_url && !image_urls) {
    return res.status(400).json({ code: 400, message: '内容不能为空' });
  }

  const worker = db.prepare('SELECT * FROM t_worker WHERE user_id = ?').get(req.user.id);
  if (!worker) {
    return res.status(400).json({ code: 400, message: '您还不是服务者' });
  }

  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO t_community_post (worker_id, content_type, content_text, voice_url, image_urls, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.id, content_type, content_text, voice_url, image_urls, now);

  const post = db.prepare('SELECT * FROM t_community_post WHERE id = ?').get(result.lastInsertRowid);

  res.json({ code: 0, message: '发布成功', data: post });
});

router.post('/posts/:postId/like', authMiddleware, (req, res) => {
  const { postId } = req.params;

  db.prepare('UPDATE t_community_post SET like_count = like_count + 1 WHERE id = ?').run(postId);

  res.json({ code: 0, message: '点赞成功' });
});

router.get('/my-posts', authMiddleware, (req, res) => {
  const posts = db.prepare(`
    SELECT * FROM t_community_post WHERE worker_id = ? ORDER BY created_at DESC
  `).all(req.user.id);

  res.json({ code: 0, message: 'success', data: posts });
});

module.exports = router;