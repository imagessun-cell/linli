const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.get('/courses', authMiddleware, async (req, res) => {
  try {
    const courses = await db.allSync('SELECT * FROM t_course ORDER BY sort_order ASC');
    res.json({ code: 0, message: 'success', data: courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/courses/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await db.getSync('SELECT * FROM t_course WHERE id = ?', [courseId]);

    if (!course) {
      return res.status(404).json({ code: 404, message: '课程不存在' });
    }

    const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ?', [req.user.id]);
    let record = null;
    if (worker) {
      record = await db.getSync('SELECT * FROM t_learning_record WHERE worker_id = ? AND course_id = ?', [worker.id, courseId]);
    }

    res.json({ code: 0, message: 'success', data: { course, record } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.put('/courses/:courseId/progress', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { progress_percent, finished = 0 } = req.body;

    const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ?', [req.user.id]);
    if (!worker) {
      return res.status(400).json({ code: 400, message: '您还不是服务者' });
    }

    const now = new Date().toISOString();
    const existing = await db.getSync('SELECT * FROM t_learning_record WHERE worker_id = ? AND course_id = ?', [worker.id, courseId]);

    if (existing) {
      await db.runSync(`
        UPDATE t_learning_record SET progress_percent = ?, finished = ?, last_watch_time = ?
        WHERE worker_id = ? AND course_id = ?
      `, [progress_percent, finished, now, worker.id, courseId]);
    } else {
      await db.runSync(`
        INSERT INTO t_learning_record (worker_id, course_id, progress_percent, finished, last_watch_time)
        VALUES (?, ?, ?, ?, ?)
      `, [worker.id, courseId, progress_percent, finished, now]);
    }

    res.json({ code: 0, message: '进度已更新' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/my-courses', authMiddleware, async (req, res) => {
  try {
    const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ?', [req.user.id]);
    if (!worker) {
      return res.json({ code: 0, message: 'success', data: [] });
    }

    const records = await db.allSync(`
      SELECT r.*, c.title, c.cover_url, c.duration_seconds
      FROM t_learning_record r
      JOIN t_course c ON r.course_id = c.id
      WHERE r.worker_id = ?
      ORDER BY r.last_watch_time DESC
    `, [worker.id]);

    res.json({ code: 0, message: 'success', data: records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
