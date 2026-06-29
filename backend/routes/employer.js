const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');
const { sendOrderDynamic } = require('../utils/orderDynamic');

const INVITE_SERVICES = {
  full: { subType: 1, name: '全程陪同', price: 168, minutes: 180 },
  medicine: { subType: 2, name: '挂号取药', price: 68, minutes: 60 },
  clinic: { subType: 3, name: '门诊陪护', price: 128, minutes: 120 },
  consult: { subType: 4, name: '代为问诊', price: 98, minutes: 90 }
};

const SERVICE_NAMES = {
  1: '全程陪同',
  2: '挂号取药',
  3: '门诊陪护',
  4: '代为问诊',
  5: '陪诊师培训'
};

const resolveInviteService = (body = {}, task = {}) => {
  const service = INVITE_SERVICES[body.service_type] || INVITE_SERVICES.full;
  const price = Number(body.service_price || task.budget || service.price);
  const minutes = Number(body.duration_minutes || task.duration_minutes || service.minutes);
  return {
    ...service,
    name: body.service_name || service.name,
    price,
    minutes
  };
};

router.post('/tasks', authMiddleware, async (req, res) => {
  try {
    console.log('发布任务 - req.user:', req.user);
    console.log('req.headers.authorization:', req.headers.authorization?.substring(0, 50));

    if (!req.user || !req.user.id) {
      return res.status(401).json({ code: 401, message: '用户未登录，请先登录' });
    }

    const { type, sub_type, start_time, end_time, duration_minutes, address, latitude, longitude, physical_level, budget, is_charity, special_requirements, department, patient_info, special_assist, target_hospital, target_hospital_lat, target_hospital_lng } = req.body;

    if (!type || !start_time || !end_time || !duration_minutes || !address || budget === undefined) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }

    if (type === 1 && !sub_type) {
      return res.status(400).json({ code: 400, message: '请选择陪诊子服务类型' });
    }

    const now = new Date().toISOString();
    const expiresAt = new Date(new Date(start_time).getTime() - 30 * 60 * 1000).toISOString();
    const targetHospital = target_hospital || address;
    const patientLocation = address;
    const assistText = Array.isArray(special_assist) && special_assist.length > 0
      ? `需要：${special_assist.join('、')}`
      : '';
    const fullRequirements = [
      department ? `科室：${department}` : '',
      patient_info ? `患者：${patient_info}` : '',
      assistText,
      special_requirements || ''
    ].filter(Boolean).join(' | ');

    console.log('准备插入数据:', { employer_id: req.user.id, type, start_time, end_time, duration_minutes, patientLocation, targetHospital, budget, sub_type: sub_type || null });

    const result = await db.runSync(`
      INSERT INTO t_task (employer_id, type, start_time, end_time, duration_minutes, address, latitude, longitude, physical_level, budget, is_charity, special_requirements, status, created_at, expires_at, sub_type, target_hospital, target_hospital_lat, target_hospital_lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
    `, req.user.id, type, start_time, end_time, duration_minutes, patientLocation, latitude || 0, longitude || 0, physical_level || 1, budget, is_charity || 0, fullRequirements, now, expiresAt, sub_type || null, targetHospital, target_hospital_lat || null, target_hospital_lng || null);

    console.log('任务发布成功, task_id:', result.lastInsertRowid);
    res.json({ code: 0, message: '任务发布成功', data: { task_id: result.lastInsertRowid } });
  } catch (err) {
    console.error('发布任务错误:', err.message);
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message });
  }
});

router.get('/workers', async (req, res) => {
  try {
    const { page = 1, limit = 20, skills, community, keyword } = req.query;
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
    if (keyword && keyword.trim()) {
      const kw = keyword.trim();
      sql += ` AND (w.community LIKE ? OR w.skills LIKE ? OR u.nickname LIKE ?)`;
      params.push(`%${kw}%`, `%${kw}%`, `%${kw}%`);
    }

    sql += ` ORDER BY w.avg_rating DESC, w.total_orders DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const workers = await db.allSync(sql, ...params);
    const totalResult = await db.getSync(`SELECT COUNT(*) as count FROM t_worker w WHERE w.status = 1`);

    res.json({ code: 0, message: 'success', data: { workers, total: totalResult.count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/workers/:workerId/invite', authMiddleware, async (req, res) => {
  try {
    const workerId = Number(req.params.workerId);
    const { task_id } = req.body;

    const worker = await db.getSync(`
      SELECT w.*, u.nickname
      FROM t_worker w
      JOIN t_user u ON w.user_id = u.id
      WHERE w.user_id = ? AND w.status = 1
    `, [workerId]);
    if (!worker) {
      return res.status(404).json({ code: 404, message: '陪诊师不存在或未认证' });
    }

    const now = new Date().toISOString();
    let task = null;

    if (task_id) {
      task = await db.getSync('SELECT * FROM t_task WHERE id = ? AND employer_id = ?', [task_id, req.user.id]);
      if (!task) {
        return res.status(404).json({ code: 404, message: '任务不存在' });
      }
      const existingOrder = await db.getSync('SELECT id FROM t_order WHERE task_id = ?', [task.id]);
      if (existingOrder) {
        return res.status(400).json({ code: 400, message: '该任务已生成订单' });
      }
    }

    const service = resolveInviteService(req.body, task || {});

    if (!task) {
      const startTime = req.body.start_time || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const endTime = req.body.end_time || new Date(new Date(startTime).getTime() + service.minutes * 60 * 1000).toISOString();
      const expiresAt = new Date(new Date(startTime).getTime() - 30 * 60 * 1000).toISOString();
      const address = req.body.address || '就诊人地点待确认';
      const targetHospital = req.body.target_hospital || '就近医院待确认';

      const taskResult = await db.runSync(`
        INSERT INTO t_task (employer_id, type, sub_type, start_time, end_time, duration_minutes, address, latitude, longitude, physical_level, budget, is_charity, special_requirements, status, worker_id, created_at, expires_at, target_hospital, target_hospital_lat, target_hospital_lng)
        VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, 1, ?, 0, ?, 1, ?, ?, ?, ?, ?, ?)
      `, [
        req.user.id,
        service.subType,
        startTime,
        endTime,
        service.minutes,
        address,
        req.body.latitude || 0,
        req.body.longitude || 0,
        service.price,
        `${service.name}已支付，等待陪诊师确认服务安排。`,
        workerId,
        now,
        expiresAt,
        targetHospital,
        req.body.target_hospital_lat || null,
        req.body.target_hospital_lng || null
      ]);

      task = await db.getSync('SELECT * FROM t_task WHERE id = ?', [taskResult.lastInsertRowid]);
    } else {
      await db.runSync(
        'UPDATE t_task SET worker_id = ?, status = 1, budget = ?, sub_type = COALESCE(sub_type, ?) WHERE id = ?',
        [workerId, service.price, service.subType, task.id]
      );
      task = await db.getSync('SELECT * FROM t_task WHERE id = ?', [task.id]);
    }

    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const platform_commission = service.price * 0.1;
    const worker_income = service.price - platform_commission;

    const orderResult = await db.runSync(`
      INSERT INTO t_order (task_id, order_no, employer_id, worker_id, total_amount, platform_commission, worker_income, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [task.id, orderNo, req.user.id, workerId, service.price, platform_commission, worker_income, now]);

    const order = await db.getSync('SELECT * FROM t_order WHERE id = ?', [orderResult.lastInsertRowid]);
    await sendOrderDynamic(req, {
      order,
      fromUserId: req.user.id,
      toUserId: workerId,
      serviceName: service.name,
      statusText: '已支付，等待陪诊师确认服务时间',
      amount: service.price
    });

    res.json({ code: 0, message: '支付成功，订单已生成', data: { order, order_id: order.id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message });
  }
});

router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT o.*, COALESCE(t.sub_type, t.type) as task_type, t.address, t.start_time, t.end_time,
             w.nickname as worker_nickname, w.phone as worker_phone,
             e.nickname as employer_nickname
      FROM t_order o
      JOIN t_task t ON o.task_id = t.id
      LEFT JOIN t_worker w ON o.worker_id = w.user_id
      JOIN t_user e ON o.employer_id = e.id
      WHERE o.employer_id = ?
    `;
    const params = [req.user.id];

    if (status !== undefined) {
      sql += ` AND o.status = ?`;
      params.push(parseInt(status));
    }

    sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const orders = await db.allSync(sql, ...params);
    const totalResult = await db.getSync(`SELECT COUNT(*) as count FROM t_order WHERE employer_id = ?`, req.user.id);

    res.json({ code: 0, message: 'success', data: { orders, total: totalResult.count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.put('/orders/:orderId/confirm', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const now = new Date().toISOString();

    const order = await db.getSync(`
      SELECT o.*, COALESCE(t.sub_type, t.type) as task_type, t.sub_type
      FROM t_order o
      JOIN t_task t ON o.task_id = t.id
      WHERE o.id = ? AND o.employer_id = ?
    `, [orderId, req.user.id]);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }

    await db.runSync('UPDATE t_order SET status = 4, complete_time = ? WHERE id = ?', [now, orderId]);
    await db.runSync('UPDATE t_task SET status = 3 WHERE id = ?', [order.task_id]);

    await sendOrderDynamic(req, {
      order: { ...order, status: 4 },
      fromUserId: req.user.id,
      toUserId: order.worker_id,
      serviceName: SERVICE_NAMES[order.sub_type || order.task_type] || '陪诊服务',
      statusText: '就诊人已确认完成，服务结束',
      amount: order.total_amount
    });

    res.json({ code: 0, message: '已确认完成' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/tasks', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT t.*,
             w.nickname as worker_nickname, w.phone as worker_phone,
             u.nickname as employer_nickname
      FROM t_task t
      LEFT JOIN t_worker w ON t.worker_id = w.user_id
      JOIN t_user u ON t.employer_id = u.id
      WHERE t.employer_id = ?
    `;
    const params = [req.user.id];

    if (status !== undefined) {
      sql += ` AND t.status = ?`;
      params.push(parseInt(status));
    }

    sql += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const tasks = await db.allSync(sql, ...params);
    const totalResult = await db.getSync(`SELECT COUNT(*) as count FROM t_task WHERE employer_id = ?`, req.user.id);

    res.json({ code: 0, message: 'success', data: { tasks, total: totalResult.count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
