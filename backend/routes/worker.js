const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.post('/apply', authMiddleware, async (req, res) => {
  try {
    const { age, community, service_radius, skills, emergency_contact_name, emergency_contact_phone } = req.body;

    if (age < 50 || age > 65) {
      return res.status(400).json({ code: 400, message: '年龄必须在50-65岁之间' });
    }

    const now = new Date().toISOString();
    const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ?', [req.user.id]);

    if (worker) {
      await db.runSync(`
        UPDATE t_worker SET age = ?, community = ?, service_radius = ?, skills = ?,
        emergency_contact_name = ?, emergency_contact_phone = ?, status = 0
        WHERE user_id = ?
      `, [age, community, service_radius, JSON.stringify(skills), emergency_contact_name, emergency_contact_phone, req.user.id]);
    } else {
      const workerResult = await db.runSync(`
        INSERT INTO t_worker (user_id, age, community, service_radius, skills, emergency_contact_name, emergency_contact_phone, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `, [req.user.id, age, community, service_radius, JSON.stringify(skills), emergency_contact_name, emergency_contact_phone]);

      await db.runSync('INSERT INTO t_wallet (worker_id) VALUES (?)', [workerResult.lastInsertRowid]);
    }

    res.json({ code: 0, message: '认证申请已提交' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/tasks/recommend', authMiddleware, async (req, res) => {
  try {
    const tasks = await db.allSync(`
      SELECT t.*, u.nickname as employer_nickname, u.phone as employer_phone
      FROM t_task t
      JOIN t_user u ON t.employer_id = u.id
      WHERE t.status = 0 AND t.expires_at > datetime('now')
      ORDER BY t.is_charity DESC, t.created_at DESC
      LIMIT 20
    `);

    res.json({ code: 0, message: 'success', data: tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/tasks/hall', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'distance', lat, lng } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    const tasks = await db.allSync(`
      SELECT t.*, u.nickname as employer_nickname
      FROM t_task t
      JOIN t_user u ON t.employer_id = u.id
      WHERE t.status = 0 AND t.expires_at > datetime('now')
      ORDER BY t.is_charity DESC, t.budget DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), offset]);

    // 计算距离并按排序方式排序
    const calcDistance = (lat1, lng1, lat2, lng2) => {
      if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
      const toRad = (v) => (v * Math.PI) / 180;
      const R = 6371; // 地球半径（km）
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    tasks.forEach((t) => {
      t.distance = calcDistance(userLat, userLng, t.latitude, t.longitude);
    });

    if (sortBy === 'distance') {
      tasks.sort((a, b) => {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });
    } else if (sortBy === 'budget') {
      tasks.sort((a, b) => (b.budget || 0) - (a.budget || 0));
    } else if (sortBy === 'physicalLevel') {
      tasks.sort((a, b) => (a.physical_level || 99) - (b.physical_level || 99));
    }

    const totalResult = await db.getSync(`
      SELECT COUNT(*) as count FROM t_task WHERE status = 0 AND expires_at > datetime('now')
    `);

    res.json({ code: 0, message: 'success', data: { tasks, total: totalResult.count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/tasks/:taskId/accept', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await db.getSync('SELECT * FROM t_task WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ code: 404, message: '任务不存在' });
    }
    if (task.status !== 0) {
      return res.status(400).json({ code: 400, message: '任务已被接单' });
    }

    const now = new Date().toISOString();
    await db.runSync('UPDATE t_task SET status = 1, worker_id = ?, updated_at = ? WHERE id = ?', [req.user.id, now, taskId]);

    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const platform_commission = task.budget * 0.1;
    const worker_income = task.budget - platform_commission;

    await db.runSync(`
      INSERT INTO t_order (task_id, order_no, employer_id, worker_id, total_amount, platform_commission, worker_income, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [taskId, orderNo, task.employer_id, req.user.id, task.budget, platform_commission, worker_income, now]);

    await db.runSync('UPDATE t_worker SET total_orders = total_orders + 1 WHERE user_id = ?', [req.user.id]);

    res.json({ code: 0, message: '接单成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.put('/orders/:orderId/start', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const now = new Date().toISOString();

    const order = await db.getSync('SELECT * FROM t_order WHERE id = ? AND worker_id = ?', [orderId, req.user.id]);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }

    await db.runSync('UPDATE t_order SET status = 2, start_service_time = ? WHERE id = ?', [now, orderId]);
    await db.runSync('UPDATE t_task SET status = 2 WHERE id = ?', [order.task_id]);

    res.json({ code: 0, message: '服务已开始', data: { insurance_no: `INS${Date.now()}` } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.put('/orders/:orderId/complete', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { verification_images } = req.body;
    const now = new Date().toISOString();

    const order = await db.getSync('SELECT * FROM t_order WHERE id = ? AND worker_id = ?', [orderId, req.user.id]);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }

    await db.runSync('UPDATE t_order SET status = 3, finish_service_time = ? WHERE id = ?', [now, orderId]);
    await db.runSync('UPDATE t_task SET status = 3 WHERE id = ?', [order.task_id]);

    await db.runSync('UPDATE t_wallet SET cash_balance = cash_balance + ? WHERE worker_id = ?', [order.worker_income, req.user.id]);

    await db.runSync(`
      INSERT INTO t_wallet_transaction (wallet_id, type, amount, order_id, status, created_at)
      SELECT w.id, 1, ?, ?, 1, ? FROM t_wallet w WHERE w.worker_id = ?
    `, [order.worker_income, orderId, now, req.user.id]);

    res.json({ code: 0, message: '服务已完成，等待就诊人确认' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/orders/:orderId/emergency', authMiddleware, (req, res) => {
  res.json({ code: 0, message: '紧急求助已发送', data: { hotline: '110' } });
});

router.get('/wallet', authMiddleware, async (req, res) => {
  try {
    const wallet = await db.getSync('SELECT * FROM t_wallet WHERE worker_id = ?', [req.user.id]);
    if (!wallet) {
      await db.runSync('INSERT INTO t_wallet (worker_id) VALUES (?)', [req.user.id]);
      return res.json({ code: 0, message: 'success', data: { cash_balance: 0, points_balance: 0, frozen_amount: 0 } });
    }
    res.json({ code: 0, message: 'success', data: wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/wallet/withdraw', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const wallet = await db.getSync('SELECT * FROM t_wallet WHERE worker_id = ?', [req.user.id]);
    if (!wallet || wallet.cash_balance < amount) {
      return res.status(400).json({ code: 400, message: '余额不足' });
    }

    const now = new Date().toISOString();
    await db.runSync('UPDATE t_wallet SET frozen_amount = frozen_amount + ? WHERE worker_id = ?', [amount, req.user.id]);

    await db.runSync(`
      INSERT INTO t_wallet_transaction (wallet_id, type, amount, status, created_at)
      VALUES ((SELECT id FROM t_wallet WHERE worker_id = ?), 2, ?, 0, ?)
    `, [req.user.id, amount, now]);

    res.json({ code: 0, message: '提现申请已提交' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
