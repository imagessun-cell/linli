const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

// ===== 1. 服务协议签署 =====

// 获取协议内容
router.get('/agreement/content', async (req, res) => {
  try {
    const content = `《健康陪诊服务协议》

一、服务边界
1. 本平台提供的陪诊服务仅包含就医陪同、挂号取药、门诊陪护、代为问诊四大类。
2. 陪诊服务不包含任何医疗行为，包括但不限于：代替就诊、代替用药、操作医疗设备、出具诊断意见。
3. 如陪诊师出现以上违规行为，用户有权立即终止服务并向平台举报。

二、双方权责
1. 用户应如实提供就诊人病史、过敏史等必要信息。
2. 陪诊师应按时到达指定地点，全程佩戴工牌，文明服务。
3. 双方均不得私下交易，所有费用必须通过平台结算。

三、免责条款
1. 平台为信息撮合方，不对医疗结果承担责任。
2. 因不可抗力导致服务无法进行的，双方互不担责。

四、隐私保护
1. 平台对用户信息实施加密存储，仅服务当天对陪诊师授权查看。
2. 任何一方不得泄露对方隐私信息，违者承担法律责任。`;

    res.json({ code: 0, message: 'success', data: { version: '1.0', content } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 签署协议
router.post('/agreement/sign', authMiddleware, async (req, res) => {
  try {
    const { agreement_type } = req.body; // 'publish' 发布方, 'accept' 接单方

    if (!['publish', 'accept'].includes(agreement_type)) {
      return res.status(400).json({ code: 400, message: '协议类型无效' });
    }

    // 检查是否已签署
    const existing = await db.getSync(
      'SELECT * FROM t_service_agreement WHERE user_id = ? AND agreement_type = ?',
      [req.user.id, agreement_type]
    );

    if (existing) {
      return res.json({ code: 0, message: '您已签署过该协议', data: existing });
    }

    const result = await db.runSync(
      'INSERT INTO t_service_agreement (user_id, agreement_type) VALUES (?, ?)',
      [req.user.id, agreement_type]
    );

    const record = await db.getSync('SELECT * FROM t_service_agreement WHERE id = ?', [result.lastInsertRowid]);
    res.json({ code: 0, message: '签署成功', data: record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 检查是否已签署协议
router.get('/agreement/check/:type', authMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const record = await db.getSync(
      'SELECT * FROM t_service_agreement WHERE user_id = ? AND agreement_type = ?',
      [req.user.id, type]
    );

    res.json({ code: 0, message: 'success', data: { signed: !!record, record } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ===== 2. 三级认证 =====

// 获取陪诊师认证信息
router.get('/certification', authMiddleware, async (req, res) => {
  try {
    const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ?', [req.user.id]);
    if (!worker) {
      return res.status(400).json({ code: 400, message: '您还不是服务者' });
    }

    const levelNames = ['未认证', '初级陪诊师', '中级陪诊师', '高级陪诊师'];
    const nextLevelRequirements = {
      0: { level: '见习', orders_needed: 10, desc: '完成基础培训 → 线上考试 ≥ 80分 → 跟单10单' },
      1: { level: '初级', orders_needed: 100, satisfaction_needed: 95, desc: '初级满100单 + 满意度 ≥ 95% + 急救培训' },
      2: { level: '中级', orders_needed: 200, satisfaction_needed: 98, desc: '中级满200单 + 满意度 ≥ 98% + 代为问诊考核' },
    };

    const currentLevel = worker.certification_level || 0;
    const progress = currentLevel >= 3 ? null : nextLevelRequirements[currentLevel];

    // 计算完成的学习记录数
    const learningCount = await db.getSync(
      'SELECT COUNT(*) as count FROM t_learning_record WHERE worker_id = ? AND finished = 1',
      [worker.id]
    );

    res.json({
      code: 0,
      message: 'success',
      data: {
        level: currentLevel,
        level_name: levelNames[currentLevel] || '未知',
        total_orders: worker.total_orders || 0,
        avg_rating: worker.avg_rating || 5.0,
        total_rating_count: worker.total_rating_count || 0,
        complaint_count: worker.complaint_count || 0,
        certification_at: worker.certification_at,
        finished_courses: learningCount.count,
        upgrade_progress: progress
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 申请升级认证
router.post('/certification/upgrade', authMiddleware, async (req, res) => {
  try {
    const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ?', [req.user.id]);
    if (!worker) {
      return res.status(400).json({ code: 400, message: '您还不是服务者' });
    }

    const currentLevel = worker.certification_level || 0;
    if (currentLevel >= 3) {
      return res.status(400).json({ code: 400, message: '您已获得最高等级认证' });
    }

    // 检查条件（简化版：主要校验订单数）
    const requirements = {
      0: { min_orders: 0 },
      1: { min_orders: 10 },
      2: { min_orders: 100, min_rating: 4.5 },
    };

    const reqs = requirements[currentLevel + 1];
    if (worker.total_orders < reqs.min_orders) {
      return res.status(400).json({
        code: 400,
        message: `还需完成 ${reqs.min_orders - worker.total_orders} 单才能升级`
      });
    }

    if (reqs.min_rating && worker.avg_rating < reqs.min_rating) {
      return res.status(400).json({
        code: 400,
        message: `满意度需达到 ${reqs.min_rating} 星以上才能升级，当前 ${worker.avg_rating} 星`
      });
    }

    const now = new Date().toISOString();
    await db.runSync(
      'UPDATE t_worker SET certification_level = ?, certification_at = ? WHERE user_id = ?',
      [currentLevel + 1, now, req.user.id]
    );

    res.json({ code: 0, message: `恭喜升级为${['初级陪诊师', '中级陪诊师', '高级陪诊师'][currentLevel]}！` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取所有陪诊师的等级分布（用于管理后台/公示）
router.get('/certification/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await db.allSync(`
      SELECT certification_level, COUNT(*) as count
      FROM t_worker
      GROUP BY certification_level
      ORDER BY certification_level ASC
    `);

    res.json({ code: 0, message: 'success', data: stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ===== 3. 服务流程打卡 =====

// 添加打卡记录
router.post('/orders/:orderId/checkpoint', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { checkpoint_key, checkpoint_name, photo_url, location_text } = req.body;

    const order = await db.getSync('SELECT * FROM t_order WHERE id = ? AND worker_id = ?', [orderId, req.user.id]);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在或无权操作' });
    }

    if (order.status < 2) {
      return res.status(400).json({ code: 400, message: '服务尚未开始，无法打卡' });
    }

    const result = await db.runSync(
      `INSERT INTO t_service_checkpoint (order_id, checkpoint_key, checkpoint_name, photo_url, location_text)
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, checkpoint_key, checkpoint_name, photo_url || null, location_text || null]
    );

    const record = await db.getSync('SELECT * FROM t_service_checkpoint WHERE id = ?', [result.lastInsertRowid]);
    res.json({ code: 0, message: '打卡成功', data: record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取订单的打卡记录
router.get('/orders/:orderId/checkpoints', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;

    const checkpoints = await db.allSync(
      'SELECT * FROM t_service_checkpoint WHERE order_id = ? ORDER BY created_at ASC',
      [orderId]
    );

    // 标准打卡节点定义
    const standardCheckpoints = [
      { key: 'arrived_hospital', name: '到达医院' },
      { key: 'registered', name: '完成取号' },
      { key: 'consulted', name: '就诊中' },
      { key: 'paid', name: '完成缴费' },
      { key: 'got_medicine', name: '完成取药' },
      { key: 'left_hospital', name: '离开医院' },
    ];

    const checkpointMap = {};
    checkpoints.forEach(cp => { checkpointMap[cp.checkpoint_key] = cp; });

    const merged = standardCheckpoints.map(sc => ({
      key: sc.key,
      name: sc.name,
      done: !!checkpointMap[sc.key],
      record: checkpointMap[sc.key] || null
    }));

    res.json({ code: 0, message: 'success', data: { list: checkpoints, progress: merged } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ===== 4. SOS 紧急求助 =====

// 触发 SOS
router.post('/sos', authMiddleware, async (req, res) => {
  try {
    const { order_id, latitude, longitude } = req.body;

    const result = await db.runSync(
      `INSERT INTO t_sos_record (user_id, order_id, latitude, longitude, status)
       VALUES (?, ?, ?, ?, 0)`,
      [req.user.id, order_id || null, latitude || null, longitude || null]
    );

    // 获取用户紧急联系人信息
    const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ?', [req.user.id]);
    const userInfo = await db.getSync('SELECT nickname, phone FROM t_user WHERE id = ?', [req.user.id]);

    const record = await db.getSync('SELECT * FROM t_sos_record WHERE id = ?', [result.lastInsertRowid]);

    // 通知平台应急小组（通过 socket.io）
    const io = req.app.get('io');
    if (io) {
      io.emit('sos_alert', {
        sos_id: record.id,
        user_id: req.user.id,
        user_name: userInfo?.nickname,
        user_phone: userInfo?.phone,
        emergency_contact: worker ? {
          name: worker.emergency_contact_name,
          phone: worker.emergency_contact_phone
        } : null,
        location: { latitude, longitude },
        order_id,
        created_at: record.created_at
      });
    }

    res.json({
      code: 0,
      message: '紧急求助已发出，平台应急小组将立即联系您！',
      data: {
        sos_id: record.id,
        hotline: '120',
        platform_contact: '400-000-0000'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取 SOS 记录
router.get('/sos/:sosId', authMiddleware, async (req, res) => {
  try {
    const { sosId } = req.params;
    const record = await db.getSync('SELECT * FROM t_sos_record WHERE id = ? AND user_id = ?', [sosId, req.user.id]);

    if (!record) {
      return res.status(404).json({ code: 404, message: '记录不存在' });
    }

    const statusNames = ['待响应', '已响应', '已关闭'];
    res.json({
      code: 0,
      message: 'success',
      data: { ...record, status_name: statusNames[record.status] || '未知' }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 管理端：获取所有待响应的 SOS
router.get('/sos/pending', authMiddleware, async (req, res) => {
  try {
    const records = await db.allSync(
      `SELECT s.*, u.nickname, u.phone
       FROM t_sos_record s
       JOIN t_user u ON s.user_id = u.id
       WHERE s.status = 0
       ORDER BY s.created_at DESC`
    );

    res.json({ code: 0, message: 'success', data: records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 管理端：响应 SOS
router.put('/sos/:sosId/respond', authMiddleware, async (req, res) => {
  try {
    const { sosId } = req.params;
    const now = new Date().toISOString();

    await db.runSync(
      'UPDATE t_sos_record SET status = 1, responded_at = ? WHERE id = ?',
      [now, sosId]
    );

    res.json({ code: 0, message: '已标记为已响应' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ===== 5. 投诉工单 =====

// 提交投诉
router.post('/complaint', authMiddleware, async (req, res) => {
  try {
    const { order_id, complaint_type, description, photo_urls, respondent_id } = req.body;

    if (!order_id || !complaint_type) {
      return res.status(400).json({ code: 400, message: '订单ID和投诉类型不能为空' });
    }

    const order = await db.getSync('SELECT * FROM t_order WHERE id = ?', [order_id]);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }

    if (order.employer_id !== req.user.id && order.worker_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权投诉此订单' });
    }

    const result = await db.runSync(
      `INSERT INTO t_complaint (order_id, complainant_id, respondent_id, complaint_type, description, photo_urls, status)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [order_id, req.user.id, respondent_id || null, complaint_type, description || null, photo_urls || null]
    );

    // 累计陪诊师投诉次数
    if (order.worker_id) {
      await db.runSync(
        'UPDATE t_worker SET complaint_count = complaint_count + 1 WHERE user_id = ?',
        [order.worker_id]
      );
    }

    const complaint = await db.getSync('SELECT * FROM t_complaint WHERE id = ?', [result.lastInsertRowid]);
    res.json({ code: 0, message: '投诉已提交，平台将在24小时内响应', data: complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 查询我的投诉
router.get('/complaints', authMiddleware, async (req, res) => {
  try {
    const complaints = await db.allSync(
      `SELECT c.*, o.order_no
       FROM t_complaint c
       JOIN t_order o ON c.order_id = o.id
       WHERE c.complainant_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    const statusNames = { 0: '待处理', 1: '处理中', 2: '已处理' };
    const result = complaints.map(c => ({
      ...c,
      status_name: statusNames[c.status] || '未知'
    }));

    res.json({ code: 0, message: 'success', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 管理端：获取所有投诉
router.get('/complaints/all', authMiddleware, async (req, res) => {
  try {
    const complaints = await db.allSync(
      `SELECT c.*, o.order_no, u.nickname as complainant_name, u2.nickname as respondent_name
       FROM t_complaint c
       JOIN t_order o ON c.order_id = o.id
       JOIN t_user u ON c.complainant_id = u.id
       LEFT JOIN t_user u2 ON c.respondent_id = u2.id
       ORDER BY c.created_at DESC`
    );

    res.json({ code: 0, message: 'success', data: complaints });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 管理端：处理投诉
router.put('/complaints/:complaintId/resolve', authMiddleware, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { resolution } = req.body;
    const now = new Date().toISOString();

    await db.runSync(
      'UPDATE t_complaint SET status = 2, resolution = ?, resolved_at = ? WHERE id = ?',
      [resolution || '已处理', now, complaintId]
    );

    res.json({ code: 0, message: '投诉已处理' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ===== 6. 接单前检查协议签署 =====

// 检查当前用户是否可以接单（必须已签署接单方协议）
router.get('/accept/check', authMiddleware, async (req, res) => {
  try {
    const record = await db.getSync(
      'SELECT * FROM t_service_agreement WHERE user_id = ? AND agreement_type = ?',
      [req.user.id, 'accept']
    );
    res.json({ code: 0, message: 'success', data: { canAccept: !!record, signed: !!record } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ===== 7. 诊前病史资料 =====

// 获取标准化病史模板
router.get('/pre-history/template', authMiddleware, async (req, res) => {
  try {
    const template = {
      patient_name: '',
      patient_age: '',
      medical_history: '',
      allergy_history: '',
      current_symptoms: '',
      medication_info: '',
      other_info: ''
    };
    res.json({ code: 0, message: 'success', data: template });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 提交诊前病史资料
router.post('/orders/:orderId/pre-history', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { patient_name, patient_age, medical_history, allergy_history, current_symptoms, medication_info, other_info, screenshot_url } = req.body;

    const order = await db.getSync('SELECT * FROM t_order WHERE id = ? AND worker_id = ?', [orderId, req.user.id]);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在或无权操作' });
    }

    const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ?', [req.user.id]);

    const result = await db.runSync(
      `INSERT INTO t_pre_history (order_id, worker_id, patient_name, patient_age, medical_history, allergy_history, current_symptoms, medication_info, other_info, screenshot_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, worker.id, patient_name, patient_age, medical_history, allergy_history, current_symptoms, medication_info, other_info, screenshot_url || null]
    );

    const record = await db.getSync('SELECT * FROM t_pre_history WHERE id = ?', [result.lastInsertRowid]);
    res.json({ code: 0, message: '病史资料已提交', data: record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取订单的病史资料
router.get('/orders/:orderId/pre-history', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const record = await db.getSync(
      'SELECT * FROM t_pre_history WHERE order_id = ? ORDER BY confirmed_at DESC LIMIT 1',
      [orderId]
    );

    res.json({ code: 0, message: 'success', data: record || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ===== 8. 诊后陪诊服务报告 =====

// 提交陪诊服务报告
router.post('/orders/:orderId/service-report', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { doctor_advice, medication_reminder, next_visit_date, photo_urls, notes } = req.body;

    const order = await db.getSync('SELECT * FROM t_order WHERE id = ? AND worker_id = ?', [orderId, req.user.id]);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在或无权操作' });
    }

    const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ?', [req.user.id]);

    const result = await db.runSync(
      `INSERT INTO t_service_report (order_id, worker_id, doctor_advice, medication_reminder, next_visit_date, photo_urls, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, worker.id, doctor_advice || null, medication_reminder || null, next_visit_date || null, photo_urls || null, notes || null]
    );

    const report = await db.getSync('SELECT * FROM t_service_report WHERE id = ?', [result.lastInsertRowid]);
    res.json({ code: 0, message: '服务报告已提交', data: report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取订单的服务报告
router.get('/orders/:orderId/service-report', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const report = await db.getSync(
      'SELECT * FROM t_service_report WHERE order_id = ? ORDER BY submitted_at DESC LIMIT 1',
      [orderId]
    );

    res.json({ code: 0, message: 'success', data: report || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ===== 9. 培训在线考试 =====

// 获取考试题目（随机抽10题）
router.get('/exam/questions', authMiddleware, async (req, res) => {
  try {
    const questions = await db.allSync(
      'SELECT id, question, options, category FROM t_exam_question ORDER BY RANDOM() LIMIT 10'
    );

    // 解析 options 为数组
    const data = questions.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }));

    res.json({ code: 0, message: 'success', data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 提交考试答案并判分
router.post('/exam/submit', authMiddleware, async (req, res) => {
  try {
    const { answers } = req.body; // { questionId: answerLetter, ... }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ code: 400, message: '请提供答案' });
    }

    const questionIds = Object.keys(answers).map(Number);
    const questions = await db.allSync(
      `SELECT id, correct_answer FROM t_exam_question WHERE id IN (${questionIds.join(',')})`
    );

    let correctCount = 0;
    const totalQuestions = questions.length;
    const results = {};

    questions.forEach(q => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) correctCount++;
      results[q.id] = { userAnswer, correctAnswer: q.correct_answer, isCorrect };
    });

    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 80 ? 1 : 0;

    const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ?', [req.user.id]);
    const now = new Date().toISOString();

    await db.runSync(
      `INSERT INTO t_exam_record (worker_id, score, total_questions, correct_count, passed, answers, finished_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [worker ? worker.id : 0, score, totalQuestions, correctCount, passed, JSON.stringify(results), now]
    );

    res.json({
      code: 0,
      message: passed ? '恭喜通过考试！' : '未通过（需要80分以上），请重新考试',
      data: { score, totalQuestions, correctCount, passed: !!passed, results }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 查询考试记录
router.get('/exam/records', authMiddleware, async (req, res) => {
  try {
    const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ?', [req.user.id]);
    if (!worker) {
      return res.json({ code: 0, message: 'success', data: [] });
    }

    const records = await db.allSync(
      'SELECT * FROM t_exam_record WHERE worker_id = ? ORDER BY finished_at DESC LIMIT 10',
      [worker.id]
    );

    res.json({ code: 0, message: 'success', data: records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ===== 10. 月度质量报告 =====

// 获取质量报告统计
router.get('/quality-report', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    // 本月订单量
    const monthOrders = await db.getSync(
      "SELECT COUNT(*) as count FROM t_order WHERE created_at >= ?", [firstDay]
    );

    // 本月完成订单
    const completedOrders = await db.getSync(
      "SELECT COUNT(*) as count FROM t_order WHERE status >= 3 AND created_at >= ?", [firstDay]
    );

    // 平均评分
    const avgRating = await db.getSync(
      "SELECT AVG(avg_rating) as avg FROM t_worker"
    );

    // 投诉数量
    const complaints = await db.getSync(
      "SELECT COUNT(*) as count FROM t_complaint WHERE created_at >= ?", [lastMonthStart]
    );

    // 陪诊师等级分布
    const levelDist = await db.allSync(
      'SELECT certification_level, COUNT(*) as count FROM t_worker GROUP BY certification_level ORDER BY certification_level'
    );

    // 总订单量（历史）
    const totalOrders = await db.getSync("SELECT COUNT(*) as count FROM t_order");

    // 订单状态分布
    const statusDist = await db.allSync(
      'SELECT status, COUNT(*) as count FROM t_order GROUP BY status ORDER BY status'
    );

    res.json({
      code: 0,
      message: 'success',
      data: {
        report_month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        month_total_orders: monthOrders.count,
        month_completed_orders: completedOrders.count,
        total_orders_all: totalOrders.count,
        avg_rating: avgRating.avg ? parseFloat(avgRating.avg.toFixed(2)) : 0,
        complaint_count: complaints.count,
        worker_level_distribution: levelDist,
        order_status_distribution: statusDist
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
