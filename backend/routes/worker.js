const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');
const { sendOrderDynamic } = require('../utils/orderDynamic');

const SERVICE_NAMES = {
  1: '全程陪同',
  2: '挂号取药',
  3: '门诊陪护',
  4: '代为问诊',
  5: '陪诊师培训'
};

const serviceNameFromOrder = (order = {}) => SERVICE_NAMES[order.sub_type || order.task_type] || '陪诊服务';

const getWorkerWallet = async (userId) => {
  const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ?', [userId]);
  const wallet = await db.getSync(`
    SELECT w.*
    FROM t_wallet w
    LEFT JOIN t_worker tw ON w.worker_id = tw.id
    WHERE tw.user_id = ? OR w.worker_id = ?
    ORDER BY CASE WHEN tw.user_id = ? THEN 0 ELSE 1 END
    LIMIT 1
  `, [userId, userId, userId]);

  if (wallet) return wallet;

  const walletWorkerId = worker?.id || userId;
  await db.runSync('INSERT INTO t_wallet (worker_id) VALUES (?)', [walletWorkerId]);
  return db.getSync('SELECT * FROM t_wallet WHERE worker_id = ?', [walletWorkerId]);
};

router.post('/apply', authMiddleware, async (req, res) => {
  try {
    const { age, community, service_radius, skills, emergency_contact_name, emergency_contact_phone, service_periods } = req.body;

    if (age < 50 || age > 65) {
      return res.status(400).json({ code: 400, message: '年龄必须在50-65岁之间' });
    }
    if (!emergency_contact_name || !String(emergency_contact_name).trim()) {
      return res.status(400).json({ code: 400, message: '请填写联系人' });
    }
    if (!emergency_contact_phone || !/^1\d{10}$/.test(String(emergency_contact_phone).trim())) {
      return res.status(400).json({ code: 400, message: '请填写正确的联系电话' });
    }
    if (!Array.isArray(service_periods) || service_periods.length === 0) {
      return res.status(400).json({ code: 400, message: '请选择可服务时间段' });
    }

    const now = new Date().toISOString();
    const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ?', [req.user.id]);
    const servicePeriodsText = JSON.stringify(service_periods);

    if (worker) {
      await db.runSync(`
        UPDATE t_worker SET age = ?, community = ?, service_radius = ?, skills = ?,
        emergency_contact_name = ?, emergency_contact_phone = ?, service_periods = ?, status = 0
        WHERE user_id = ?
      `, [age, community, service_radius, JSON.stringify(skills), emergency_contact_name, emergency_contact_phone, servicePeriodsText, req.user.id]);
    } else {
      const workerResult = await db.runSync(`
        INSERT INTO t_worker (user_id, age, community, service_radius, skills, emergency_contact_name, emergency_contact_phone, service_periods, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      `, [req.user.id, age, community, service_radius, JSON.stringify(skills), emergency_contact_name, emergency_contact_phone, servicePeriodsText]);

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

    // V1.4: 检查是否已签署接单方协议
    const agreement = await db.getSync(
      'SELECT * FROM t_service_agreement WHERE user_id = ? AND agreement_type = ?',
      [req.user.id, 'accept']
    );
    if (!agreement) {
      return res.status(400).json({ code: 400, message: '请先签署《陪诊服务免责协议》后再接单' });
    }

    const task = await db.getSync('SELECT * FROM t_task WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ code: 404, message: '任务不存在' });
    }
    if (task.status !== 0) {
      return res.status(400).json({ code: 400, message: '任务已被接单' });
    }

    const now = new Date().toISOString();
    await db.runSync('UPDATE t_task SET status = 1, worker_id = ? WHERE id = ?', [req.user.id, taskId]);

    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const platform_commission = task.budget * 0.1;
    const worker_income = task.budget - platform_commission;

    const orderResult = await db.runSync(`
      INSERT INTO t_order (task_id, order_no, employer_id, worker_id, total_amount, platform_commission, worker_income, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [taskId, orderNo, task.employer_id, req.user.id, task.budget, platform_commission, worker_income, now]);

    await db.runSync('UPDATE t_worker SET total_orders = total_orders + 1 WHERE user_id = ?', [req.user.id]);
    const order = await db.getSync('SELECT * FROM t_order WHERE id = ?', [orderResult.lastInsertRowid]);
    await sendOrderDynamic(req, {
      order,
      fromUserId: req.user.id,
      toUserId: task.employer_id,
      serviceName: serviceNameFromOrder({ sub_type: task.sub_type, task_type: task.type }),
      statusText: '陪诊师已接单，订单待服务',
      amount: task.budget
    });

    res.json({ code: 0, message: '接单成功', data: { order_id: order.id, order } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT o.*, COALESCE(t.sub_type, t.type) as task_type, t.sub_type, t.address, t.target_hospital,
             t.duration_minutes, t.start_time, t.end_time, t.special_requirements,
             e.nickname as employer_nickname, e.phone as employer_phone
      FROM t_order o
      JOIN t_task t ON o.task_id = t.id
      JOIN t_user e ON o.employer_id = e.id
      WHERE o.worker_id = ?
    `;
    const params = [req.user.id];

    if (status !== undefined && status !== '') {
      sql += ' AND o.status = ?';
      params.push(parseInt(status));
    }

    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const orders = await db.allSync(sql, params);

    let countSql = 'SELECT COUNT(*) as count FROM t_order WHERE worker_id = ?';
    const countParams = [req.user.id];
    if (status !== undefined && status !== '') {
      countSql += ' AND status = ?';
      countParams.push(parseInt(status));
    }
    const totalResult = await db.getSync(countSql, countParams);

    res.json({ code: 0, message: 'success', data: { orders, total: totalResult.count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/orders/:orderId/quote', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ code: 400, message: '请输入正确的报价金额' });
    }

    const order = await db.getSync(`
      SELECT o.*, COALESCE(t.sub_type, t.type) as task_type, t.sub_type
      FROM t_order o
      JOIN t_task t ON o.task_id = t.id
      WHERE o.id = ? AND o.worker_id = ?
    `, [orderId, req.user.id]);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }
    if (Number(order.status) !== 7 && Number(order.status) !== 8) {
      return res.status(400).json({ code: 400, message: '当前订单不能报价' });
    }

    const platformCommission = Math.round(amount * 10) / 100;
    const workerIncome = Math.round(amount * 90) / 100;
    await db.runSync(`
      UPDATE t_order
      SET total_amount = ?, platform_commission = ?, worker_income = ?, status = 8
      WHERE id = ?
    `, [amount, platformCommission, workerIncome, orderId]);

    const updated = await db.getSync('SELECT * FROM t_order WHERE id = ?', [orderId]);
    await sendOrderDynamic(req, {
      order: { ...order, ...updated, status: 8 },
      fromUserId: req.user.id,
      toUserId: order.employer_id,
      serviceName: serviceNameFromOrder(order),
      statusText: `陪诊师已报价 ¥${amount}，等待就诊人支付`,
      amount
    });

    res.json({ code: 0, message: '报价已发送', data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message });
  }
});

router.put('/orders/:orderId/start', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const now = new Date().toISOString();

    const order = await db.getSync(`
      SELECT o.*, COALESCE(t.sub_type, t.type) as task_type, t.sub_type
      FROM t_order o
      JOIN t_task t ON o.task_id = t.id
      WHERE o.id = ? AND o.worker_id = ?
    `, [orderId, req.user.id]);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }

    await db.runSync('UPDATE t_order SET status = 2, start_service_time = ? WHERE id = ?', [now, orderId]);
    await db.runSync('UPDATE t_task SET status = 2 WHERE id = ?', [order.task_id]);
    await sendOrderDynamic(req, {
      order: { ...order, status: 2 },
      fromUserId: req.user.id,
      toUserId: order.employer_id,
      serviceName: serviceNameFromOrder(order),
      statusText: '服务已开始，陪诊师正在陪同就诊',
      amount: order.total_amount
    });

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

    const order = await db.getSync(`
      SELECT o.*, COALESCE(t.sub_type, t.type) as task_type, t.sub_type
      FROM t_order o
      JOIN t_task t ON o.task_id = t.id
      WHERE o.id = ? AND o.worker_id = ?
    `, [orderId, req.user.id]);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }

    await db.runSync('UPDATE t_order SET status = 3, finish_service_time = ? WHERE id = ?', [now, orderId]);
    await db.runSync('UPDATE t_task SET status = 3 WHERE id = ?', [order.task_id]);

    const wallet = await getWorkerWallet(req.user.id);
    await db.runSync('UPDATE t_wallet SET cash_balance = cash_balance + ? WHERE id = ?', [order.worker_income, wallet.id]);

    await db.runSync(`
      INSERT INTO t_wallet_transaction (wallet_id, type, amount, order_id, status, created_at)
      VALUES (?, 1, ?, ?, 1, ?)
    `, [wallet.id, order.worker_income, orderId, now]);
    await sendOrderDynamic(req, {
      order: { ...order, status: 3 },
      fromUserId: req.user.id,
      toUserId: order.employer_id,
      serviceName: serviceNameFromOrder(order),
      statusText: '陪诊师已提交完成，等待就诊人确认',
      amount: order.total_amount
    });

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
    const wallet = await getWorkerWallet(req.user.id);
    res.json({ code: 0, message: 'success', data: wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/wallet/transactions', authMiddleware, async (req, res) => {
  try {
    const wallet = await getWorkerWallet(req.user.id);
    const transactions = await db.allSync(`
      SELECT * FROM t_wallet_transaction
      WHERE wallet_id = ?
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT 50
    `, [wallet.id]);
    res.json({ code: 0, message: 'success', data: transactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/wallet/recharge', authMiddleware, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ code: 400, message: '请输入正确的充值金额' });
    }

    const wallet = await getWorkerWallet(req.user.id);
    const now = new Date().toISOString();
    await db.runSync('UPDATE t_wallet SET cash_balance = cash_balance + ? WHERE id = ?', [amount, wallet.id]);
    await db.runSync(`
      INSERT INTO t_wallet_transaction (wallet_id, type, amount, status, created_at)
      VALUES (?, 4, ?, 1, ?)
    `, [wallet.id, amount, now]);

    res.json({ code: 0, message: '充值成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/wallet/withdraw', authMiddleware, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ code: 400, message: '请输入正确的提现金额' });
    }
    const wallet = await getWorkerWallet(req.user.id);
    if (!wallet || wallet.cash_balance < amount) {
      return res.status(400).json({ code: 400, message: '余额不足' });
    }

    const now = new Date().toISOString();
    await db.runSync('UPDATE t_wallet SET cash_balance = cash_balance - ?, frozen_amount = frozen_amount + ? WHERE id = ?', [amount, amount, wallet.id]);

    await db.runSync(`
      INSERT INTO t_wallet_transaction (wallet_id, type, amount, status, created_at)
      VALUES (?, 2, ?, 0, ?)
    `, [wallet.id, amount, now]);

    res.json({ code: 0, message: '提现申请已提交' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
