const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');
const { getDistance } = require('./location');

const TASK_TYPES = {
  1: { name: '陪诊', icon: '🩺', hasSubTypes: true },
  2: { name: '陪聊', icon: '💬', hasSubTypes: false },
  3: { name: '保洁', icon: '🧹', hasSubTypes: false },
  4: { name: '做饭', icon: '🍳', hasSubTypes: false },
  5: { name: '接送', icon: '🚗', hasSubTypes: false },
  6: { name: '看护', icon: '👴', hasSubTypes: false },
  7: { name: '跑腿', icon: '📦', hasSubTypes: false },
  8: { name: '助教', icon: '📚', hasSubTypes: false }
};

const ESCORT_SUB_TYPES = {
  1: { name: '全程陪同', icon: '👣', desc: '从出发到返家，全程陪伴老人完成就诊所有环节', priceRange: '80-120元/半天' },
  2: { name: '挂号取药', icon: '💊', desc: '仅代为排队挂号、缴费、取药，无需全程陪诊', priceRange: '30-50元/次' },
  3: { name: '门诊陪护', icon: '🪑', desc: '在诊室外候诊、检查、缴费环节提供陪伴，不进入诊室', priceRange: '50-80元/次' },
  4: { name: '代为问诊', icon: '📝', desc: '代替老人向医生描述病情、记录医嘱、取药，老人无需到场', priceRange: '60-100元/次' }
};

const PHYSICAL_LEVELS = {
  1: { name: '轻度', color: '#52c41a' },
  2: { name: '中度', color: '#faad14' },
  3: { name: '重度', color: '#f5222d' }
};

router.get('/sub-types', (req, res) => {
  res.json({
    code: 0,
    message: 'OK',
    data: ESCORT_SUB_TYPES
  });
});

router.get('/types', (req, res) => {
  const types = Object.entries(TASK_TYPES).map(([id, info]) => ({
    id: parseInt(id),
    name: info.name,
    icon: info.icon,
    hasSubTypes: info.hasSubTypes || false
  }));
  res.json({
    code: 0,
    message: 'OK',
    data: types
  });
});

router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000, page = 1, pageSize = 20, sortBy = 'distance', type, subType, physicalLevel } = req.query;

    const rows = await db.allSync(`
      SELECT t.*,
             u.nickname as employer_nickname,
             u.avatar_url as employer_avatar,
             e.credit_score as employer_rating
      FROM t_task t
      JOIN t_user u ON t.employer_id = u.id
      LEFT JOIN t_employer e ON u.id = e.user_id
      WHERE t.status = 0 AND t.expires_at > datetime('now')
    `);

    let tasks = rows || [];

    if (latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude))) {
      tasks = tasks
        .filter(task => task.latitude && task.longitude)
        .map(task => {
          const distance = getDistance(
            parseFloat(latitude), parseFloat(longitude),
            task.latitude, task.longitude
          );
          return { ...task, distance: Math.round(distance) };
        });

      tasks = tasks.filter(task => task.distance <= parseInt(radius));

      if (sortBy === 'distance') {
        tasks.sort((a, b) => a.distance - b.distance);
      } else if (sortBy === 'budget') {
        tasks.sort((a, b) => b.budget - a.budget);
      } else if (sortBy === 'physicalLevel') {
        tasks.sort((a, b) => a.physical_level - b.physical_level);
      }
    }

    if (type) {
      const types = type.split(',').map(Number);
      tasks = tasks.filter(task => types.includes(task.type));
    }

    if (subType) {
      const subTypes = subType.split(',').map(Number);
      tasks = tasks.filter(task => task.sub_type && subTypes.includes(task.sub_type));
    }

    if (physicalLevel) {
      const levels = physicalLevel.split(',').map(Number);
      tasks = tasks.filter(task => levels.includes(task.physical_level));
    }

    const total = tasks.length;
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const end = start + parseInt(pageSize);
    const paged = tasks.slice(start, end);

    const list = paged.map(task => ({
      id: task.id,
      type: task.type,
      typeName: TASK_TYPES[task.type]?.name || '其他',
      typeIcon: TASK_TYPES[task.type]?.icon || '📋',
      subType: task.sub_type,
      subTypeName: task.sub_type ? (ESCORT_SUB_TYPES[task.sub_type]?.name || null) : null,
      subTypeIcon: task.sub_type ? (ESCORT_SUB_TYPES[task.sub_type]?.icon || '') : null,
      title: task.sub_type
        ? `${ESCORT_SUB_TYPES[task.sub_type]?.name || '陪诊'} - ${task.address.split('区')[1] || task.address.slice(0, 10)}...`
        : `${TASK_TYPES[task.type]?.name || '服务'} - ${task.address.split('区')[1] || task.address.slice(0, 10)}...`,
      startTime: task.start_time,
      endTime: task.end_time,
      duration: task.duration_minutes,
      address: task.address,
      latitude: task.latitude,
      longitude: task.longitude,
      distance: task.distance || null,
      physicalLevel: task.physical_level,
      physicalLevelName: PHYSICAL_LEVELS[task.physical_level]?.name || '未知',
      physicalLevelColor: PHYSICAL_LEVELS[task.physical_level]?.color || '#999',
      budget: task.budget,
      isCharity: task.is_charity,
      employerNickname: task.employer_nickname,
      employerAvatar: task.employer_avatar,
      employerRating: task.employer_rating || 5.0,
      status: task.status,
      createdAt: task.created_at
    }));

    res.json({
      code: 0,
      message: 'OK',
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        hasMore: end < total
      }
    });
  } catch (err) {
    console.error('nearby query error:', err);
    res.status(500).json({ code: 500, message: '查询失败' });
  }
});

router.get('/suggestions', async (req, res) => {
  try {
    const { q = '', limit = 8 } = req.query;
    const keyword = String(q).trim();

    if (!keyword) {
      return res.json({ code: 0, message: 'OK', data: { suggestions: [], hotKeywords: getHotKeywords() } });
    }

    // 1) 从真实任务表中查（address）
    const like = `%${keyword}%`;
    const rows = await db.allSync(`
      SELECT DISTINCT address, type, sub_type
      FROM t_task
      WHERE status = 0 AND expires_at > datetime('now') AND address LIKE ?
      LIMIT ?
    `, [like, parseInt(limit) * 2]);

    const suggestionMap = new Map();

    const pushIfNew = (item) => {
      if (!item || !item.text) return;
      if (!suggestionMap.has(item.text)) {
        suggestionMap.set(item.text, item);
      }
    };

    // 整段地址 / 拆分关键词
    rows.forEach((row) => {
      const addr = row.address || '';
      if (addr.toLowerCase().includes(keyword.toLowerCase())) {
        pushIfNew({ text: addr, type: 'address', taskType: row.type });
      }
      const parts = addr.split(/[市区县路街道号]/).filter(p => p.length >= 2);
      parts.forEach((part) => {
        if (part.includes(keyword)) {
          pushIfNew({ text: part, type: 'keyword', taskType: row.type });
        }
      });
    });

    // 2) 任务类型 / 子类型联想
    Object.entries(TASK_TYPES).forEach(([k, v]) => {
      if (v.name.includes(keyword)) {
        pushIfNew({ text: v.name, type: 'type', taskType: Number(k) });
      }
    });
    Object.entries(ESCORT_SUB_TYPES).forEach(([k, v]) => {
      if (v.name.includes(keyword)) {
        pushIfNew({ text: v.name, type: 'subType', taskType: 1 });
      }
    });

    // 3) 特殊需求 / 备注联想
    const reqRows = await db.allSync(`
      SELECT DISTINCT special_requirements
      FROM t_task
      WHERE status = 0 AND expires_at > datetime('now') AND special_requirements LIKE ?
      LIMIT ?
    `, [like, parseInt(limit)]);
    reqRows.forEach((row) => {
      const txt = row.special_requirements || '';
      if (txt.includes(keyword)) {
        // 截取关键词附近片段（最多 30 字）
        const idx = txt.indexOf(keyword);
        const start = Math.max(0, idx - 8);
        const end = Math.min(txt.length, idx + keyword.length + 16);
        const snippet = (start > 0 ? '…' : '') + txt.slice(start, end) + (end < txt.length ? '…' : '');
        pushIfNew({ text: snippet, type: 'requirement', taskType: null });
      }
    });

    const suggestions = Array.from(suggestionMap.values()).slice(0, parseInt(limit));
    res.json({ code: 0, message: 'OK', data: { suggestions, hotKeywords: getHotKeywords() } });
  } catch (err) {
    console.error('suggestions error:', err);
    res.status(500).json({ code: 500, message: '查询失败' });
  }
});

const HOT_KEYWORDS = ['陪诊', '中山医院', '华山医院', '仁济医院', '瑞金医院', '徐汇区', '浦东新区', '静安区'];
function getHotKeywords() {
  return HOT_KEYWORDS;
}

router.get('/public/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await db.getSync(`
      SELECT t.*,
             u.nickname as employer_nickname,
             u.avatar_url as employer_avatar,
             e.credit_score as employer_rating
      FROM t_task t
      JOIN t_user u ON t.employer_id = u.id
      LEFT JOIN t_employer e ON u.id = e.user_id
      WHERE t.id = ?
    `, [taskId]);

    if (!task) {
      return res.status(404).json({ code: 404, message: '任务不存在' });
    }

    res.json({
      code: 0,
      message: 'OK',
      data: {
        id: task.id,
        type: task.type,
        typeName: TASK_TYPES[task.type]?.name || '其他',
        typeIcon: TASK_TYPES[task.type]?.icon || '📋',
        subType: task.sub_type,
        subTypeName: task.sub_type ? (ESCORT_SUB_TYPES[task.sub_type]?.name || null) : null,
        subTypeIcon: task.sub_type ? (ESCORT_SUB_TYPES[task.sub_type]?.icon || '') : null,
        title: task.sub_type
          ? `${ESCORT_SUB_TYPES[task.sub_type]?.name || '陪诊'} - ${task.address.split('区')[1] || task.address.slice(0, 10)}...`
          : `${TASK_TYPES[task.type]?.name || '服务'} - ${task.address.split('区')[1] || task.address.slice(0, 10)}...`,
        startTime: task.start_time,
        endTime: task.end_time,
        duration: task.duration_minutes,
        address: task.address,
        latitude: task.latitude,
        longitude: task.longitude,
        physicalLevel: task.physical_level,
        physicalLevelName: PHYSICAL_LEVELS[task.physical_level]?.name || '未知',
        physicalLevelColor: PHYSICAL_LEVELS[task.physical_level]?.color || '#999',
        budget: task.budget,
        isCharity: task.is_charity,
        specialRequirements: task.special_requirements,
        employerNickname: task.employer_nickname,
        employerAvatar: task.employer_avatar,
        employerRating: task.employer_rating || 5.0,
        status: task.status,
        createdAt: task.created_at
      }
    });
  } catch (err) {
    console.error('public task error:', err);
    res.status(500).json({ code: 500, message: '查询失败' });
  }
});

router.get('/:taskId', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await db.getSync(`
      SELECT t.*, u.nickname as employer_nickname, u.phone as employer_phone
      FROM t_task t
      JOIN t_user u ON t.employer_id = u.id
      WHERE t.id = ?
    `, [taskId]);

    if (!task) {
      return res.status(404).json({ code: 404, message: '任务不存在' });
    }

    res.json({ code: 0, message: 'success', data: task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.put('/:taskId/cancel', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const now = new Date().toISOString();

    const task = await db.getSync('SELECT * FROM t_task WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ code: 404, message: '任务不存在' });
    }

    if (task.employer_id !== req.user.id && task.worker_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权取消此任务' });
    }

    if (task.status > 2) {
      return res.status(400).json({ code: 400, message: '当前状态无法取消' });
    }

    await db.runSync('UPDATE t_task SET status = 4, updated_at = ? WHERE id = ?', [now, taskId]);

    if (task.status === 1) {
      await db.runSync('UPDATE t_order SET status = 5 WHERE task_id = ?', [taskId]);
    }

    res.json({ code: 0, message: '任务已取消' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/:taskId/grab', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const now = new Date().toISOString();

    const task = await db.getSync('SELECT * FROM t_task WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ code: 404, message: '任务不存在' });
    }

    if (task.status !== 0) {
      return res.status(400).json({ code: 400, message: '该任务已被接单' });
    }

    if (new Date(task.expires_at) < new Date()) {
      return res.status(400).json({ code: 400, message: '该任务已过期' });
    }

    const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ? AND status = 1', [req.user.id]);
    if (!worker) {
      return res.status(403).json({ code: 403, message: '您还未成为认证服务者' });
    }

    await db.runSync('UPDATE t_task SET worker_id = ?, status = 1, updated_at = ? WHERE id = ?', [req.user.id, now, taskId]);

    const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
    const platformCommission = task.budget * 0.1;
    const workerIncome = task.budget - platformCommission;

    await db.runSync(`
      INSERT INTO t_order (task_id, order_no, employer_id, worker_id, total_amount, platform_commission, worker_income, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [taskId, orderNo, task.employer_id, req.user.id, task.budget, platformCommission, workerIncome, now]);

    await db.runSync('UPDATE t_worker SET total_orders = total_orders + 1 WHERE user_id = ?', [req.user.id]);

    res.json({ code: 0, message: '接单成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
