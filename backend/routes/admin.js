const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

// 所有管理接口需要登录
router.use(authMiddleware);

// ─── 仪表盘统计 ───
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
      code: 0, message: 'success', data: {
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

// ─── 用户管理 ───
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword } = req.query;
    const offset = (page - 1) * limit;
    let sql = 'SELECT id, openid, phone, nickname, avatar_url, role, status, real_name, face_verified, created_at, updated_at FROM t_user';
    const params = [];
    const where = [];

    if (keyword && keyword.trim()) {
      where.push('(phone LIKE ? OR nickname LIKE ? OR real_name LIKE ?)');
      const kw = `%${keyword.trim()}%`;
      params.push(kw, kw, kw);
    }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const users = await db.allSync(sql, ...params);
    const countResult = await db.getSync('SELECT COUNT(*) as count FROM t_user' + (where.length ? ' WHERE ' + where.join(' AND ') : ''), ...params.slice(0, -2));

    res.json({ code: 0, message: 'success', data: { users, total: countResult.count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { nickname, phone, role, status, real_name } = req.body;

    const sets = [];
    const params = [];
    if (nickname !== undefined) { sets.push('nickname = ?'); params.push(nickname); }
    if (phone !== undefined) { sets.push('phone = ?'); params.push(phone); }
    if (role !== undefined) { sets.push('role = ?'); params.push(role); }
    if (status !== undefined) { sets.push('status = ?'); params.push(status); }
    if (real_name !== undefined) { sets.push('real_name = ?'); params.push(real_name); }
    if (sets.length === 0) return res.status(400).json({ code: 400, message: '没有要更新的字段' });

    sets.push("updated_at = datetime('now')");
    params.push(userId);

    await db.runSync(`UPDATE t_user SET ${sets.join(', ')} WHERE id = ?`, params);
    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // 级联删除关联数据
    await db.runSync('DELETE FROM t_worker WHERE user_id = ?', [userId]);
    await db.runSync('DELETE FROM t_employer WHERE user_id = ?', [userId]);
    await db.runSync('DELETE FROM t_wallet WHERE worker_id NOT IN (SELECT id FROM t_worker)');
    await db.runSync('DELETE FROM t_user WHERE id = ?', [userId]);
    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ─── 任务管理（审核/修改）───
router.get('/tasks', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, keyword } = req.query;
    const offset = (page - 1) * limit;
    let sql = `
      SELECT t.*, u.nickname as employer_nickname, u.phone as employer_phone
      FROM t_task t
      JOIN t_user u ON t.employer_id = u.id
    `;
    const params = [];
    const where = [];

    if (status !== undefined && status !== '') {
      where.push('t.status = ?');
      params.push(parseInt(status));
    }
    if (keyword && keyword.trim()) {
      where.push('(t.address LIKE ? OR u.nickname LIKE ? OR t.special_requirements LIKE ?)');
      const kw = `%${keyword.trim()}%`;
      params.push(kw, kw, kw);
    }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const tasks = await db.allSync(sql, ...params);
    const countSql = 'SELECT COUNT(*) as count FROM t_task t JOIN t_user u ON t.employer_id = u.id' + (where.length ? ' WHERE ' + where.join(' AND ') : '');
    const countResult = await db.getSync(countSql, ...params.slice(0, -2));

    res.json({ code: 0, message: 'success', data: { tasks, total: countResult.count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.put('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { type, sub_type, address, budget, special_requirements, status } = req.body;

    const sets = [];
    const params = [];
    if (type !== undefined) { sets.push('type = ?'); params.push(type); }
    if (sub_type !== undefined) { sets.push('sub_type = ?'); params.push(sub_type); }
    if (address !== undefined) { sets.push('address = ?'); params.push(address); }
    if (budget !== undefined) { sets.push('budget = ?'); params.push(budget); }
    if (special_requirements !== undefined) { sets.push('special_requirements = ?'); params.push(special_requirements); }
    if (status !== undefined) { sets.push('status = ?'); params.push(status); }
    if (sets.length === 0) return res.status(400).json({ code: 400, message: '没有要更新的字段' });

    params.push(taskId);
    await db.runSync(`UPDATE t_task SET ${sets.join(', ')} WHERE id = ?`, params);
    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.delete('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    await db.runSync('DELETE FROM t_order WHERE task_id = ?', [taskId]);
    await db.runSync('DELETE FROM t_task WHERE id = ?', [taskId]);
    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ─── 服务者审核 ───
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
    const { status } = req.body;
    if (![1, 2].includes(status)) return res.status(400).json({ code: 400, message: '无效的审核状态' });
    await db.runSync('UPDATE t_worker SET status = ? WHERE user_id = ?', [status, workerId]);
    res.json({ code: 0, message: status === 1 ? '审核通过' : '审核驳回' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ─── 任务分类管理（t_task_type）───
router.get('/types', async (req, res) => {
  try {
    const types = await db.allSync('SELECT * FROM t_task_type ORDER BY sort_order ASC, id ASC');
    res.json({ code: 0, message: 'success', data: types });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/types', async (req, res) => {
  try {
    const { name, icon, sort_order, has_sub_types } = req.body;
    if (!name) return res.status(400).json({ code: 400, message: '分类名称不能为空' });
    const result = await db.runSync(
      'INSERT INTO t_task_type (name, icon, sort_order, has_sub_types) VALUES (?, ?, ?, ?)',
      [name, icon || '📋', sort_order || 0, has_sub_types ? 1 : 0]
    );
    const type = await db.getSync('SELECT * FROM t_task_type WHERE id = ?', [result.lastInsertRowid]);
    res.json({ code: 0, message: '创建成功', data: type });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.put('/types/:typeId', async (req, res) => {
  try {
    const { typeId } = req.params;
    const { name, icon, sort_order, has_sub_types } = req.body;
    const sets = [];
    const params = [];
    if (name !== undefined) { sets.push('name = ?'); params.push(name); }
    if (icon !== undefined) { sets.push('icon = ?'); params.push(icon); }
    if (sort_order !== undefined) { sets.push('sort_order = ?'); params.push(sort_order); }
    if (has_sub_types !== undefined) { sets.push('has_sub_types = ?'); params.push(has_sub_types ? 1 : 0); }
    if (sets.length === 0) return res.status(400).json({ code: 400, message: '没有要更新的字段' });
    params.push(typeId);
    await db.runSync(`UPDATE t_task_type SET ${sets.join(', ')} WHERE id = ?`, params);
    const type = await db.getSync('SELECT * FROM t_task_type WHERE id = ?', [typeId]);
    res.json({ code: 0, message: '更新成功', data: type });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.delete('/types/:typeId', async (req, res) => {
  try {
    const { typeId } = req.params;
    await db.runSync('DELETE FROM t_task_type WHERE id = ?', [typeId]);
    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
