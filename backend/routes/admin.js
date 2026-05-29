const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.use(authMiddleware);

router.get('/workers/pending', (req, res) => {
  const workers = db.prepare(`
    SELECT w.*, u.nickname, u.phone, u.avatar_url
    FROM t_worker w
    JOIN t_user u ON w.user_id = u.id
    WHERE w.status = 0
    ORDER BY w.id DESC
  `).all();

  res.json({ code: 0, message: 'success', data: workers });
});

router.put('/workers/:workerId/verify', (req, res) => {
  const { workerId } = req.params;
  const { status, reason } = req.body;

  if (![1, 2].includes(status)) {
    return res.status(400).json({ code: 400, message: '无效的审核状态' });
  }

  db.prepare('UPDATE t_worker SET status = ? WHERE user_id = ?').run(status, workerId);

  res.json({ code: 0, message: status === 1 ? '审核通过' : '审核驳回' });
});

router.get('/stats', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM t_user').get().count;
  const totalWorkers = db.prepare('SELECT COUNT(*) as count FROM t_worker WHERE status = 1').get().count;
  const totalTasks = db.prepare('SELECT COUNT(*) as count FROM t_task').get().count;
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM t_order').get().count;
  const totalAmount = db.prepare('SELECT SUM(total_amount) as sum FROM t_order WHERE status >= 3').get().sum || 0;

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = db.prepare(`SELECT COUNT(*) as count FROM t_task WHERE date(created_at) = ?`).get(today).count;
  const todayOrders = db.prepare(`SELECT COUNT(*) as count FROM t_order WHERE date(created_at) = ?`).get(today).count;

  res.json({
    code: 0,
    message: 'success',
    data: {
      totalUsers,
      totalWorkers,
      totalTasks,
      totalOrders,
      totalAmount: Math.round(totalAmount * 100) / 100,
      todayTasks,
      todayOrders
    }
  });
});

router.get('/complaints', (req, res) => {
  const complaints = db.prepare(`
    SELECT o.*, t.type as task_type, t.address,
           eu.nickname as employer_nickname, eu.phone as employer_phone,
           wu.nickname as worker_nickname, wu.phone as worker_phone
    FROM t_order o
    JOIN t_task t ON o.task_id = t.id
    JOIN t_user eu ON o.employer_id = eu.id
    LEFT JOIN t_user wu ON o.worker_id = wu.id
    WHERE o.status = 6
    ORDER BY o.created_at DESC
  `).all();

  res.json({ code: 0, message: 'success', data: complaints });
});

router.put('/complaints/:orderId/handle', (req, res) => {
  const { orderId } = req.params;
  const { action } = req.body;

  if (action === 'refund') {
    db.prepare('UPDATE t_order SET status = 5 WHERE id = ?').run(orderId);
  } else if (action === 'close') {
    db.prepare('UPDATE t_order SET status = 4 WHERE id = ?').run(orderId);
  }

  res.json({ code: 0, message: '处理完成' });
});

router.get('/courses', (req, res) => {
  const courses = db.prepare('SELECT * FROM t_course ORDER BY sort_order ASC').all();
  res.json({ code: 0, message: 'success', data: courses });
});

router.post('/courses', (req, res) => {
  const { title, video_url, duration_seconds, cover_url, sort_order, is_required } = req.body;

  const result = db.prepare(`
    INSERT INTO t_course (title, video_url, duration_seconds, cover_url, sort_order, is_required)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, video_url, duration_seconds || 0, cover_url, sort_order || 0, is_required || 0);

  const course = db.prepare('SELECT * FROM t_course WHERE id = ?').get(result.lastInsertRowid);
  res.json({ code: 0, message: '创建成功', data: course });
});

router.put('/courses/:courseId', (req, res) => {
  const { courseId } = req.params;
  const { title, video_url, duration_seconds, cover_url, sort_order, is_required } = req.body;

  db.prepare(`
    UPDATE t_course SET title = ?, video_url = ?, duration_seconds = ?, cover_url = ?, sort_order = ?, is_required = ?
    WHERE id = ?
  `).run(title, video_url, duration_seconds, cover_url, sort_order, is_required, courseId);

  const course = db.prepare('SELECT * FROM t_course WHERE id = ?').get(courseId);
  res.json({ code: 0, message: '更新成功', data: course });
});

module.exports = router;