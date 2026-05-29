const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.post('/tasks', authMiddleware, (req, res) => {
  const { type, start_time, end_time, duration_minutes, address, latitude, longitude, physical_level, budget, is_charity, special_requirements } = req.body;

  if (!type || !start_time || !end_time || !duration_minutes || !address || budget === undefined) {
    return res.status(400).json({ code: 400, message: '缺少必要参数' });
  }

  const now = new Date().toISOString();
  const expiresAt = new Date(new Date(start_time).getTime() - 30 * 60 * 1000).toISOString();

  const result = db.prepare(`
    INSERT INTO t_task (employer_id, type, start_time, end_time, duration_minutes, address, latitude, longitude, physical_level, budget, is_charity, special_requirements, status, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(req.user.id, type, start_time, end_time, duration_minutes, address, latitude || 0, longitude || 0, physical_level || 1, budget, is_charity || 0, special_requirements, now, expiresAt);

  res.json({ code: 0, message: '任务发布成功', data: { task_id: result.lastInsertRowid } });
});

router.get('/workers', authMiddleware, (req, res) => {
  const { page = 1, limit = 20, skills, community } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT w.*, u.nickname, u.avatar_url, u.phone
    FROM t_worker w
    JOIN t_user u ON w.user_id = u.id
    WHERE w.status = 1
  `;
  const params = [];

  if (skills) {
    sql += ` AND w.skills LIKE ?`;
    params.push(`%${skills}%`);
  }
  if (community) {
    sql += ` AND w.community LIKE ?`;
    params.push(`%${community}%`);
  }

  sql += ` ORDER BY w.avg_rating DESC, w.total_orders DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const workers = db.prepare(sql).all(...params);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM t_worker w WHERE w.status = 1
  `).get().count;

  res.json({ code: 0, message: 'success', data: { workers, total } });
});

router.post('/workers/:workerId/invite', authMiddleware, (req, res) => {
  const { workerId } = req.params;
  const { task_id } = req.body;

  const task = db.prepare('SELECT * FROM t_task WHERE id = ? AND employer_id = ?').get(task_id, req.user.id);
  if (!task) {
    return res.status(404).json({ code: 404, message: '任务不存在' });
  }

  db.prepare('UPDATE t_task SET worker_id = ?, status = 1 WHERE id = ?').run(workerId, task_id);

  const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const platform_commission = task.budget * 0.1;
  const worker_income = task.budget - platform_commission;

  db.prepare(`
    INSERT INTO t_order (task_id, order_no, employer_id, worker_id, total_amount, platform_commission, worker_income, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(task_id, orderNo, req.user.id, workerId, task.budget, platform_commission, worker_income, new Date().toISOString());

  res.json({ code: 0, message: '已邀请服务者' });
});

router.get('/orders', authMiddleware, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT o.*, t.type as task_type, t.address, t.start_time, t.end_time,
           wu.nickname as worker_nickname, wu.phone as worker_phone
    FROM t_order o
    JOIN t_task t ON o.task_id = t.id
    LEFT JOIN t_user wu ON o.worker_id = wu.id
    WHERE o.employer_id = ?
  `;
  const params = [req.user.id];

  if (status !== undefined) {
    sql += ` AND o.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const orders = db.prepare(sql).all(...params);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM t_order WHERE employer_id = ?
  `).get(req.user.id).count;

  res.json({ code: 0, message: 'success', data: { orders, total } });
});

router.put('/orders/:orderId/confirm', authMiddleware, (req, res) => {
  const { orderId } = req.params;
  const now = new Date().toISOString();

  const order = db.prepare('SELECT * FROM t_order WHERE id = ? AND employer_id = ?').get(orderId, req.user.id);
  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }

  if (order.status !== 3) {
    return res.status(400).json({ code: 400, message: '订单状态不正确' });
  }

  db.prepare('UPDATE t_order SET status = 4, complete_time = ? WHERE id = ?').run(now, orderId);
  db.prepare('UPDATE t_task SET status = 4 WHERE id = ?').run(order.task_id);

  const points_earned = Math.floor(order.total_amount);
  db.prepare('UPDATE t_wallet SET points_balance = points_balance + ? WHERE worker_id = ?')
    .run(points_earned, order.worker_id);

  res.json({ code: 0, message: '确认完成' });
});

module.exports = router;