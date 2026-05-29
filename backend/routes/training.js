const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.get('/courses', authMiddleware, (req, res) => {
  const courses = db.prepare('SELECT * FROM t_course ORDER BY sort_order ASC').all();
  res.json({ code: 0, message: 'success', data: courses });
});

router.get('/courses/:courseId', authMiddleware, (req, res) => {
  const { courseId } = req.params;
  const course = db.prepare('SELECT * FROM t_course WHERE id = ?').get(courseId);

  if (!course) {
    return res.status(404).json({ code: 404, message: '课程不存在' });
  }

  const worker = db.prepare('SELECT * FROM t_worker WHERE user_id = ?').get(req.user.id);
  let record = null;
  if (worker) {
    record = db.prepare('SELECT * FROM t_learning_record WHERE worker_id = ? AND course_id = ?')
      .get(worker.id, courseId);
  }

  res.json({ code: 0, message: 'success', data: { course, record } });
});

router.put('/courses/:courseId/progress', authMiddleware, (req, res) => {
  const { courseId } = req.params;
  const { progress_percent, finished = 0 } = req.body;

  const worker = db.prepare('SELECT * FROM t_worker WHERE user_id = ?').get(req.user.id);
  if (!worker) {
    return res.status(400).json({ code: 400, message: '您还不是服务者' });
  }

  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM t_learning_record WHERE worker_id = ? AND course_id = ?')
    .get(worker.id, courseId);

  if (existing) {
    db.prepare(`
      UPDATE t_learning_record SET progress_percent = ?, finished = ?, last_watch_time = ?
      WHERE worker_id = ? AND course_id = ?
    `).run(progress_percent, finished, now, worker.id, courseId);
  } else {
    db.prepare(`
      INSERT INTO t_learning_record (worker_id, course_id, progress_percent, finished, last_watch_time)
      VALUES (?, ?, ?, ?, ?)
    `).run(worker.id, courseId, progress_percent, finished, now);
  }

  res.json({ code: 0, message: '进度已更新' });
});

router.get('/my-courses', authMiddleware, (req, res) => {
  const worker = db.prepare('SELECT * FROM t_worker WHERE user_id = ?').get(req.user.id);
  if (!worker) {
    return res.json({ code: 0, message: 'success', data: [] });
  }

  const records = db.prepare(`
    SELECT r.*, c.title, c.cover_url, c.duration_seconds
    FROM t_learning_record r
    JOIN t_course c ON r.course_id = c.id
    WHERE r.worker_id = ?
    ORDER BY r.last_watch_time DESC
  `).all(worker.id);

  res.json({ code: 0, message: 'success', data: records });
});

module.exports = router;