const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.post('/apply', authMiddleware, (req, res) => {
  const { age, community, service_radius, skills, emergency_contact_name, emergency_contact_phone } = req.body;

  if (age < 50 || age > 65) {
    return res.status(400).json({ code: 400, message: '年龄必须在50-65岁之间' });
  }

  const now = new Date().toISOString();
  const worker = db.prepare('SELECT * FROM t_worker WHERE user_id = ?').get(req.user.id);

  if (worker) {
    db.prepare(`
      UPDATE t_worker SET age = ?, community = ?, service_radius = ?, skills = ?,
      emergency_contact_name = ?, emergency_contact_phone = ?, status = 0
      WHERE user_id = ?
    `).run(age, community, service_radius, JSON.stringify(skills), emergency_contact_name, emergency_contact_phone, req.user.id);
  } else {
    db.prepare(`
      INSERT INTO t_worker (user_id, age, community, service_radius, skills, emergency_contact_name, emergency_contact_phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(req.user.id, age, community, service_radius, JSON.stringify(skills), emergency_contact_name, emergency_contact_phone);
    db.prepare('INSERT INTO t_wallet (worker_id) VALUES (?)').run(req.user.id);
  }

  res.json({ code: 0, message: '认证申请已提交' });
});

router.get('/tasks/recommend', authMiddleware, (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, u.nickname as employer_nickname, u.phone as employer_phone
    FROM t_task t
    JOIN t_user u ON t.employer_id = u.id
    WHERE t.status = 0 AND t.expires_at > datetime('now')
    ORDER BY t.is_charity DESC, t.created_at DESC
    LIMIT 20
  `).all();

  res.json({ code: 0, message: 'success', data: tasks });
});

router.get('/tasks/hall', authMiddleware, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const tasks = db.prepare(`
    SELECT t.*, u.nickname as employer_nickname
    FROM t_task t
    JOIN t_user u ON t.employer_id = u.id
    WHERE t.status = 0 AND t.expires_at > datetime('now')
    ORDER BY t.is_charity DESC, t.budget DESC, t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM t_task WHERE status = 0 AND expires_at > datetime('now')
  `).get().count;

  res.json({ code: 0, message: 'success', data: { tasks, total } });
});

router.post('/tasks/:taskId/accept', authMiddleware, (req, res) => {
  const { taskId } = req.params;

  const task = db.prepare('SELECT * FROM t_task WHERE id = ?').get(taskId);
  if (!task) {
    return res.status(404).json({ code: 404, message: '任务不存在' });
  }
  if (task.status !== 0) {
    return res.status(400).json({ code: 400, message: '任务已被接单' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE t_task SET status = 1, worker_id = ?, updated_at = ? WHERE id = ?')
    .run(req.user.id, now, taskId);

  const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const platform_commission = task.budget * 0.1;
  const worker_income = task.budget - platform_commission;

  db.prepare(`
    INSERT INTO t_order (task_id, order_no, employer_id, worker_id, total_amount, platform_commission, worker_income, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(taskId, orderNo, task.employer_id, req.user.id, task.budget, platform_commission, worker_income, now);

  db.prepare('UPDATE t_worker SET total_orders = total_orders + 1 WHERE user_id = ?').run(req.user.id);

  res.json({ code: 0, message: '接单成功' });
});

router.put('/orders/:orderId/start', authMiddleware, (req, res) => {
  const { orderId } = req.params;
  const now = new Date().toISOString();

  const order = db.prepare('SELECT * FROM t_order WHERE id = ? AND worker_id = ?').get(orderId, req.user.id);
  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }

  db.prepare('UPDATE t_order SET status = 2, start_service_time = ? WHERE id = ?').run(now, orderId);
  db.prepare('UPDATE t_task SET status = 2 WHERE id = ?').run(order.task_id);

  res.json({ code: 0, message: '服务已开始', data: { insurance_no: `INS${Date.now()}` } });
});

router.put('/orders/:orderId/complete', authMiddleware, (req, res) => {
  const { orderId } = req.params;
  const { verification_images } = req.body;
  const now = new Date().toISOString();

  const order = db.prepare('SELECT * FROM t_order WHERE id = ? AND worker_id = ?').get(orderId, req.user.id);
  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }

  db.prepare('UPDATE t_order SET status = 3, finish_service_time = ? WHERE id = ?').run(now, orderId);
  db.prepare('UPDATE t_task SET status = 3 WHERE id = ?').run(order.task_id);

  db.prepare('UPDATE t_wallet SET cash_balance = cash_balance + ? WHERE worker_id = ?')
    .run(order.worker_income, req.user.id);

  db.prepare(`
    INSERT INTO t_wallet_transaction (wallet_id, type, amount, order_id, status, created_at)
    SELECT w.id, 1, ?, ?, 1, ? FROM t_wallet w WHERE w.worker_id = ?
  `).run(order.worker_income, orderId, now, req.user.id);

  res.json({ code: 0, message: '服务已完成，等待用工方确认' });
});

router.post('/orders/:orderId/emergency', authMiddleware, (req, res) => {
  res.json({ code: 0, message: '紧急求助已发送', data: { hotline: '110' } });
});

router.get('/wallet', authMiddleware, (req, res) => {
  const wallet = db.prepare('SELECT * FROM t_wallet WHERE worker_id = ?').get(req.user.id);
  if (!wallet) {
    db.prepare('INSERT INTO t_wallet (worker_id) VALUES (?)').run(req.user.id);
    return res.json({ code: 0, message: 'success', data: { cash_balance: 0, points_balance: 0, frozen_amount: 0 } });
  }
  res.json({ code: 0, message: 'success', data: wallet });
});

router.post('/wallet/withdraw', authMiddleware, (req, res) => {
  const { amount } = req.body;

  const wallet = db.prepare('SELECT * FROM t_wallet WHERE worker_id = ?').get(req.user.id);
  if (!wallet || wallet.cash_balance < amount) {
    return res.status(400).json({ code: 400, message: '余额不足' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE t_wallet SET frozen_amount = frozen_amount + ? WHERE worker_id = ?').run(amount, req.user.id);

  db.prepare(`
    INSERT INTO t_wallet_transaction (wallet_id, type, amount, status, created_at)
    VALUES ((SELECT id FROM t_wallet WHERE worker_id = ?), 2, ?, 0, ?)
  `).run(req.user.id, amount, now);

  res.json({ code: 0, message: '提现申请已提交' });
});

module.exports = router;