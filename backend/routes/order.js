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
      SELECT o.*, COALESCE(t.sub_type, t.type) as task_type, t.sub_type, t.address, t.start_time, t.end_time, t.special_requirements,
             eu.nickname as employer_nickname, eu.phone as employer_phone,
             wu.nickname as worker_nickname, wu.phone as worker_phone
      FROM t_order o
      JOIN t_task t ON o.task_id = t.id
      JOIN t_user eu ON o.employer_id = eu.id
      LEFT JOIN t_user wu ON o.worker_id = wu.id
      WHERE o.id = ?
    `, [orderId]);

    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }

    res.json({ code: 0, message: 'success', data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
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
