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

router.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await db.getSync(`
      SELECT o.*, COALESCE(t.sub_type, t.type) as task_type, t.sub_type, t.address, t.target_hospital,
             t.duration_minutes, t.start_time, t.end_time, t.special_requirements,
             eu.nickname as employer_nickname, eu.phone as employer_phone, eu.avatar_url as employer_avatar,
             wu.nickname as worker_nickname, wu.phone as worker_phone, wu.avatar_url as worker_avatar,
             r.id as review_id, r.punctuality as review_punctuality,
             r.communication as review_communication, r.process as review_process,
             r.comment as review_comment, r.created_at as review_created_at
      FROM t_order o
      JOIN t_task t ON o.task_id = t.id
      JOIN t_user eu ON o.employer_id = eu.id
      LEFT JOIN t_user wu ON o.worker_id = wu.id
      LEFT JOIN t_order_review r ON r.order_id = o.id
      WHERE o.id = ?
    `, [orderId]);

    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }

    if (order.review_id) {
      order.review = {
        id: order.review_id,
        punctuality: order.review_punctuality,
        communication: order.review_communication,
        process: order.review_process,
        comment: order.review_comment,
        created_at: order.review_created_at
      };
    }

    res.json({ code: 0, message: 'success', data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/:orderId/review', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const punctuality = Number(req.body.punctuality || 5);
    const communication = Number(req.body.communication || 5);
    const process = Number(req.body.process || 5);
    const comment = req.body.comment || '';
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
    if (!order.worker_id || Number(order.status) < 3) {
      return res.status(400).json({ code: 400, message: '当前订单还不能评价' });
    }

    const existing = await db.getSync('SELECT * FROM t_order_review WHERE order_id = ?', [orderId]);
    if (existing) {
      return res.json({ code: 0, message: '评价已提交', data: existing });
    }

    const result = await db.runSync(`
      INSERT INTO t_order_review (order_id, worker_id, employer_id, punctuality, communication, process, comment, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [orderId, order.worker_id, req.user.id, punctuality, communication, process, comment, now]);

    const score = Math.max(1, Math.min(5, (punctuality + communication + process) / 3));
    const worker = await db.getSync('SELECT avg_rating, total_rating_count FROM t_worker WHERE user_id = ?', [order.worker_id]);
    if (worker) {
      const oldCount = Number(worker.total_rating_count || 0);
      const newCount = oldCount + 1;
      const newRating = ((Number(worker.avg_rating || 5) * oldCount) + score) / newCount;
      await db.runSync(
        'UPDATE t_worker SET avg_rating = ?, total_rating_count = ? WHERE user_id = ?',
        [Number(newRating.toFixed(2)), newCount, order.worker_id]
      );
    }

    const review = await db.getSync('SELECT * FROM t_order_review WHERE id = ?', [result.lastInsertRowid]);
    await sendOrderDynamic(req, {
      order,
      fromUserId: req.user.id,
      toUserId: order.worker_id,
      serviceName: SERVICE_NAMES[order.sub_type || order.task_type] || '陪诊服务',
      statusText: `就诊人已评价 ${score.toFixed(1)} 分`,
      amount: order.total_amount
    });

    res.json({ code: 0, message: '评价已提交', data: review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message });
  }
});

router.post('/:orderId/cancel', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await db.getSync(`
      SELECT o.*, COALESCE(t.sub_type, t.type) as task_type, t.sub_type
      FROM t_order o
      JOIN t_task t ON o.task_id = t.id
      WHERE o.id = ?
    `, [orderId]);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }

    if (order.employer_id !== req.user.id && order.worker_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权取消此订单' });
    }

    if (order.status > 2) {
      return res.status(400).json({ code: 400, message: '当前状态无法取消' });
    }

    await db.runSync('UPDATE t_order SET status = 5 WHERE id = ?', [orderId]);
    await db.runSync('UPDATE t_task SET status = 4 WHERE id = ?', [order.task_id]);
    await sendOrderDynamic(req, {
      order: { ...order, status: 5 },
      fromUserId: req.user.id,
      toUserId: Number(req.user.id) === Number(order.worker_id) ? order.employer_id : order.worker_id,
      serviceName: SERVICE_NAMES[order.sub_type || order.task_type] || '陪诊服务',
      statusText: '订单已取消',
      amount: order.total_amount
    });

    res.json({ code: 0, message: '订单已取消' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/:orderId/complaint', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await db.getSync(`
      SELECT o.*, COALESCE(t.sub_type, t.type) as task_type, t.sub_type
      FROM t_order o
      JOIN t_task t ON o.task_id = t.id
      WHERE o.id = ?
    `, [orderId]);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }

    if (order.employer_id !== req.user.id && order.worker_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权投诉此订单' });
    }

    await db.runSync('UPDATE t_task SET status = 5 WHERE id = ?', [order.task_id]);
    await db.runSync('UPDATE t_order SET status = 6 WHERE id = ?', [orderId]);
    await sendOrderDynamic(req, {
      order: { ...order, status: 6 },
      fromUserId: req.user.id,
      toUserId: Number(req.user.id) === Number(order.worker_id) ? order.employer_id : order.worker_id,
      serviceName: SERVICE_NAMES[order.sub_type || order.task_type] || '陪诊服务',
      statusText: reason ? `已提交投诉：${reason}` : '已提交投诉',
      amount: order.total_amount
    });

    res.json({ code: 0, message: '投诉已提交' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
