const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.use(authMiddleware);

router.get('/workers/pending', async (req, res) => {
  try {
    const workers = await db.allSync(`
      SELECT w.*, u.nickname, u.phone, u.avatar_url
      FROM t_worker w
      JOIN t_user u ON w.user_id = u.id
      WHERE w.status = 0
      ORDER BY w.id DESC
    `);
    res.json({ code: 0, message: 'success', data: workers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.put('/workers/:workerId/verify', async (req, res) => {
  try {
    const { workerId } = req.params;
    const { status, reason } = req.body;

    if (![1, 2].includes(status)) {
      return res.status(400).json({ code: 400, message: '无效的审核状态' });
    }

    await db.runSync('UPDATE t_worker SET status = ? WHERE user_id = ?', [status, workerId]);
    res.json({ code: 0, message: status === 1 ? '审核通过' : '审核驳回' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await db.getSync('SELECT COUNT(*) as count FROM t_user');
    const totalWorkers = await db.getSync('SELECT COUNT(*) as count FROM t_worker WHERE status = 1');
    const totalTasks = await db.getSync('SELECT COUNT(*) as count FROM t_task');
    const totalOrders = await db.getSync('SELECT COUNT(*) as count FROM t_order');
    const totalAmount = await db.getSync('SELECT SUM(total_amount) as sum FROM t_order WHERE status >= 3');

    const today = new Date().toISOString().split('T')[0];
    const todayTasks = await db.getSync(`SELECT COUNT(*) as count FROM t_task WHERE date(created_at) = ?`, [today]);
    const todayOrders = await db.getSync(`SELECT COUNT(*) as count FROM t_order WHERE date(created_at) = ?`, [today]);

    res.json({
      code: 0,
      message: 'success',
      data: {
        totalUsers: totalUsers.count,
        totalWorkers: totalWorkers.count,
        totalTasks: totalTasks.count,
        totalOrders: totalOrders.count,
        totalAmount: Math.round((totalAmount.sum || 0) * 100) / 100,
        todayTasks: todayTasks.count,
        todayOrders: todayOrders.count
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/complaints', async (req, res) => {
  try {
    const complaints = await db.allSync(`
      SELECT o.*, t.type as task_type, t.address,
             eu.nickname as employer_nickname, eu.phone as employer_phone,
             wu.nickname as worker_nickname, wu.phone as worker_phone
      FROM t_order o
      JOIN t_task t ON o.task_id = t.id
      JOIN t_user eu ON o.employer_id = eu.id
      LEFT JOIN t_user wu ON o.worker_id = wu.id
      WHERE o.status = 6
      ORDER BY o.created_at DESC
    `);
    res.json({ code: 0, message: 'success', data: complaints });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.put('/complaints/:orderId/handle', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action } = req.body;

    if (action === 'refund') {
      await db.runSync('UPDATE t_order SET status = 5 WHERE id = ?', [orderId]);
    } else if (action === 'close') {
      await db.runSync('UPDATE t_order SET status = 4 WHERE id = ?', [orderId]);
    }

    res.json({ code: 0, message: '处理完成' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/courses', async (req, res) => {
  try {
    const courses = await db.allSync('SELECT * FROM t_course ORDER BY sort_order ASC');
    res.json({ code: 0, message: 'success', data: courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const { title, video_url, duration_seconds, cover_url, sort_order, is_required } = req.body;

    const result = await db.runSync(`
      INSERT INTO t_course (title, video_url, duration_seconds, cover_url, sort_order, is_required)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [title, video_url, duration_seconds || 0, cover_url, sort_order || 0, is_required || 0]);

    const course = await db.getSync('SELECT * FROM t_course WHERE id = ?', [result.lastInsertRowid]);
    res.json({ code: 0, message: '创建成功', data: course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.put('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, video_url, duration_seconds, cover_url, sort_order, is_required } = req.body;

    await db.runSync(`
      UPDATE t_course SET title = ?, video_url = ?, duration_seconds = ?, cover_url = ?, sort_order = ?, is_required = ?
      WHERE id = ?
    `, [title, video_url, duration_seconds, cover_url, sort_order, is_required, courseId]);

    const course = await db.getSync('SELECT * FROM t_course WHERE id = ?', [courseId]);
    res.json({ code: 0, message: '更新成功', data: course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
