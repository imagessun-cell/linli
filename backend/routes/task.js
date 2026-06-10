const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');
const { getDistance } = require('./location');

const TASK_TYPES = {
  1: { name: '全程陪同', icon: '👣', hasSubTypes: false },
  2: { name: '挂号取药', icon: '💊', hasSubTypes: false },
  3: { name: '门诊陪护', icon: '🪑', hasSubTypes: false },
  4: { name: '代为问诊', icon: '📝', hasSubTypes: false }
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
    const { latitude, longitude, radius = 5000, page = 1, pageSize = 20, sortBy = 'distance', order = 'asc', type, subType, physicalLevel, keyword } = req.query;

    const rows = await db.allSync(`
      SELECT t.*,
             u.nickname as employer_nickname,
             u.avatar_url as employer_avatar,
             u.community as employer_community,
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

      const isAsc = order === 'asc'
      if (sortBy === 'distance') {
        tasks.sort((a, b) => isAsc ? a.distance - b.distance : b.distance - a.distance);
      } else if (sortBy === 'budget') {
        tasks.sort((a, b) => isAsc ? a.budget - b.budget : b.budget - a.budget);
      } else if (sortBy === 'physicalLevel') {
        tasks.sort((a, b) => isAsc ? a.physical_level - b.physical_level : b.physical_level - a.physical_level);
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

    if (keyword) {
      const kw = keyword.trim().toLowerCase();
      tasks = tasks.filter(task => {
        return (task.address && task.address.toLowerCase().includes(kw)) ||
               (task.special_requirements && task.special_requirements.toLowerCase().includes(kw)) ||
               (TASK_TYPES[task.type] && TASK_TYPES[task.type].name.includes(kw));
      });
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
        ? `${ESCORT_SUB_TYPES[task.sub_type]?.name || '陪诊'} - ${task.address}`
        : `${task.address}`,
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
      employerCommunity: (task.employer_community || '').replace(/^[\u4e00-\u9fa5]{1,4}区/, ''),
      employerRating: task.employer_rating || 5.0,
      targetHospital: task.target_hospital,
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
    console.log('[suggestions] keyword=', JSON.stringify(keyword), 'SERVICE_KEYWORDS hit=', !!SERVICE_KEYWORDS[keyword]);

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

    // 3) 静态词库联想（覆盖单字、双字常见搜索）
    if (SERVICE_KEYWORDS[keyword]) {
      SERVICE_KEYWORDS[keyword].forEach((text) => {
        pushIfNew({ text, type: 'service', taskType: null });
      });
    }
    // 模糊匹配 SERVICE_KEYWORDS 的 key 含 keyword
    Object.keys(SERVICE_KEYWORDS).forEach((k) => {
      if (k !== keyword && k.includes(keyword) && keyword.length >= 1) {
        SERVICE_KEYWORDS[k].slice(0, 2).forEach((text) => {
          pushIfNew({ text, type: 'service', taskType: null });
        });
      }
    });
    HOSPITAL_KEYWORDS.forEach((h) => {
      if (h.includes(keyword)) {
        pushIfNew({ text: h, type: 'hospital', taskType: null });
      }
    });
    DISTRICT_KEYWORDS.forEach((d) => {
      if (d.includes(keyword)) {
        pushIfNew({ text: d, type: 'district', taskType: null });
      }
    });

    // 4) 特殊需求 / 备注联想
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

    let suggestions = Array.from(suggestionMap.values()).slice(0, parseInt(limit));

    // 5) Fallback：当结果不足时，从热门词/医院/行政区中补齐匹配项
    if (suggestions.length < parseInt(limit)) {
      const fillers = [...HOT_KEYWORDS, ...HOSPITAL_KEYWORDS, ...DISTRICT_KEYWORDS];
      fillers.forEach((f) => {
        if (f.includes(keyword) && !suggestionMap.has(f)) {
          suggestions.push({ text: f, type: 'hot', taskType: null });
        }
      });
      suggestions = suggestions.slice(0, parseInt(limit));
    }
    res.json({ code: 0, message: 'OK', data: { suggestions, hotKeywords: getHotKeywords() } });
  } catch (err) {
    console.error('suggestions error:', err);
    res.status(500).json({ code: 500, message: '查询失败' });
  }
});

const HOT_KEYWORDS = [
  '陪诊', '全程陪同', '挂号取药', '门诊陪护', '代为问诊',
  '朝阳医院', '中日友好医院', '北京安贞医院', '中国医学科学院肿瘤医院', '北京中医药大学东方医院', '北京华信医院',
  '国贸CBD', '三里屯', '工体', '朝阳公园', '团结湖', '六里屯',
  '老人陪护'
];

// 扩展服务词库：覆盖单字/双字常见搜索
const SERVICE_KEYWORDS = {
  // 医疗场景
  '挂号': ['挂号取药', '预约挂号', '网上挂号', '挂号窗口'],
  '就诊': ['陪同就诊', '协助就诊', '独立就诊'],
  '取药': ['取药送药', '代取药品', '取药陪同'],
  '复诊': ['复诊陪同', '复诊提醒', '定期复诊'],
  '住院': ['住院陪护', '住院探视', '出院陪同'],
  '手术': ['手术陪同', '术前检查', '术后护理'],
  '体检': ['体检陪同', '上门体检', '体检报告解读'],
  '康复': ['术后康复', '康复理疗', '康复指导'],
  '化验': ['化验陪同', '取化验单', '化验解读'],
  '检查': ['检查陪同', 'CT检查', '核磁共振'],

  // 服务动作
  '陪': ['陪诊', '陪聊', '陪护', '陪伴', '陪老人', '陪看病'],
  '诊': ['陪诊', '就诊', '复诊', '门诊', '出诊'],
  '聊': ['陪聊', '聊天', '心理陪聊', '上门陪聊'],
  '护': ['陪护', '护理', '护工', '上门护理', '住院护工'],
  '接': ['接送', '陪同接送', '上门接送', '医院接送'],
  '保': ['保洁', '上门保洁', '日常保洁', '深度保洁'],
  '做': ['做饭', '上门做饭', '家常菜', '老人餐'],

  // 医疗设施
  '医': ['医院', '陪诊医院', '朝阳医院', '中日友好医院', '肿瘤医院'],
  '院': ['医院', '养老院', '中医院', '专科医院'],
  '药': ['取药', '送药', '药品', '买药'],
  '病': ['看病', '陪看病', '病人陪护', '老年病'],

  // 老人相关
  '老': ['老人陪护', '老年餐', '老人陪伴', '独居老人'],
  '养': ['养老', '康复养老', '居家养老', '医养结合'],
  '残': ['残疾陪护', '轮椅协助', '助残服务'],
  '轮': ['轮椅', '轮椅协助', '轮椅出行'],

  // 行政区
  '国': ['国贸', '国贸CBD'],
  '三': ['三里屯'],
  '望': ['望京'],
  '劲': ['劲松'],
  '朝': ['朝阳公园', '朝阳区'],
  '管': ['管庄'],
  '常': ['常营'],

  // 城市级：输入"上海"时展开为下属行政区与医院
  '北京': [
    '国贸CBD', '三里屯', '工体', '朝阳公园', '团结湖', '六里屯', '呼家楼', '东大桥', '永安里', '光华路', '建国门外', '朝阳门外', '劲松', '双井', '潘家园', '十里堡', '八里庄', '红庙', '高碑店', '常营', '管庄', '东坝', '金盏', '孙河', '崔各庄', '望京', '酒仙桥', '麦子店', '亮马桥', '三元桥', '燕莎', '东风', '石佛营', '平房', '亚运村', '安慧桥', '北辰', '大屯', '小红门', '十八里店', '南磨房',
    '朝阳医院', '中日友好医院', '北京安贞医院', '中国医学科学院肿瘤医院', '北京中医药大学东方医院', '北京华信医院', '北京市第一中西医结合医院', '民航总医院', '朝阳区中医医院', '首都医科大学附属北京妇产医院', '朝阳区妇幼保健院', '朝阳区第二医院', '朝阳区第三医院', '朝阳区中心医院', '朝阳区东坝医院', '朝阳区常营医院', '应急总医院', '北京市垂杨柳医院', '煤炭总医院', '北京藏医院'
  ]
};

// 城市/医院名缩写
const HOSPITAL_KEYWORDS = [
  '朝阳医院', '中日友好医院', '北京安贞医院', '中国医学科学院肿瘤医院', '北京中医药大学东方医院', '北京华信医院', '北京市第一中西医结合医院', '民航总医院', '朝阳区中医医院', '首都医科大学附属北京妇产医院', '朝阳区妇幼保健院', '朝阳区第二医院', '朝阳区第三医院', '朝阳区中心医院', '朝阳区东坝医院', '朝阳区常营医院', '应急总医院', '北京市垂杨柳医院', '煤炭总医院', '北京藏医院',
  '儿童医院', '妇产科医院', '中医院', '口腔医院', '精神卫生中心'
];

const DISTRICT_KEYWORDS = [
  '国贸CBD', '三里屯', '工体', '朝阳公园', '团结湖', '六里屯', '呼家楼', '东大桥', '永安里', '光华路', '建国门外', '朝阳门外', '劲松', '双井', '潘家园', '十里堡', '八里庄', '红庙', '高碑店', '常营', '管庄', '东坝', '金盏', '孙河', '崔各庄', '望京', '酒仙桥', '麦子店', '亮马桥', '三元桥', '燕莎', '东风', '石佛营', '平房', '亚运村', '安慧桥', '北辰', '大屯', '小红门', '十八里店', '南磨房'
];
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
             u.community as employer_community,
             u.community_lat,
             u.community_lng,
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
          ? `${ESCORT_SUB_TYPES[task.sub_type]?.name || '陪诊'} - ${task.address}`
          : `${task.address}`,
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
        employerCommunity: (task.employer_community || '').replace(/^[\u4e00-\u9fa5]{1,4}区/, ''),
        employerCommunityLat: task.community_lat,
        employerCommunityLng: task.community_lng,
        employerRating: task.employer_rating || 5.0,
        targetHospital: task.target_hospital,
        employerId: task.employer_id,
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

    const task = await db.getSync(`
      SELECT t.*, u.community_lat, u.community_lng
      FROM t_task t
      LEFT JOIN t_user u ON t.employer_id = u.id
      WHERE t.id = ?
    `, [taskId]);
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

    const task = await db.getSync(`
      SELECT t.*, u.community_lat, u.community_lng
      FROM t_task t
      LEFT JOIN t_user u ON t.employer_id = u.id
      WHERE t.id = ?
    `, [taskId]);
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
