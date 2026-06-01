const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.post('/tasks', authMiddleware, async (req, res) => {
  try {
    const { type, sub_type, start_time, end_time, duration_minutes, address, latitude, longitude, physical_level, budget, is_charity, special_requirements, department, patient_info } = req.body;

    if (!type || !start_time || !end_time || !duration_minutes || !address || budget === undefined) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }

    if (type === 1 && !sub_type) {
      return res.status(400).json({ code: 400, message: '请选择陪诊子服务类型' });
    }

    const now = new Date().toISOString();
    const expiresAt = new Date(new Date(start_time).getTime() - 30 * 60 * 1000).toISOString();
    const fullAddress = department ? `${address} ${department}` : address;
    const fullRequirements = patient_info
      ? `${special_requirements || ''} | 患者：${patient_info}`.trim()
      : special_requirements;

    const result = await db.runSync(`
      INSERT INTO t_task (employer_id, type, sub_type, start_time, end_time, duration_minutes, address, latitude, longitude, physical_level, budget, is_charity, special_requirements, status, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `, req.user.id, type, sub_type || null, start_time, end_time, duration_minutes, fullAddress, latitude || 0, longitude || 0, physical_level || 1, budget, is_charity || 0, fullRequirements, now, expiresAt);

    res.json({ code: 0, message: '任务发布成功', data: { task_id: result.lastInsertRowid } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/workers', authMiddleware, async (req, res) => {
  try {
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
    const { workerId } = req.params;
    const { task_id } = req.body;

    const task = await db.getSync('SELECT * FROM t_task WHERE id = ? AND employer_id = ?', task_id, req.user.id);
    if (!task) {
      return res.status(404).json({ code: 404, message: '任务不存在' });
    }

    await db.runSync('UPDATE t_task SET worker_id = ?, status = 1 WHERE id = ?', workerId, task_id);

    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const platform_commission = task.budget * 0.1;
    const worker_income = task.budget - platform_commission;

    await db.runSync(`
      INSERT INTO t_order (task_id, order_no, employer_id, worker_id, total_amount, platform_commission, worker_income, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, task_id, orderNo, req.user.id, workerId, task.budget, platform_commission, worker_income, new Date().toISOString());

    res.json({ code: 0, message: '已邀请服务者' });
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
      SELECT o.*, t.type as task_type, t.address, t.start_time,
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
