const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await db.getSync(`
      SELECT o.*, t.type as task_type, t.address, t.start_time, t.end_time, t.special_requirements,
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
    const now = new Date().toISOString();

    const order = await db.getSync('SELECT * FROM t_order WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }

    if (order.employer_id !== req.user.id && order.worker_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权取消此订单' });
    }

    if (order.status > 2) {
      return res.status(400).json({ code: 400, message: '当前状态无法取消' });
    }

    await db.runSync('UPDATE t_order SET status = 5, cancel_time = ? WHERE id = ?', [now, orderId]);
    await db.runSync('UPDATE t_task SET status = 4 WHERE id = ?', [order.task_id]);

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

    const order = await db.getSync('SELECT * FROM t_order WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }

    if (order.employer_id !== req.user.id && order.worker_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权投诉此订单' });
    }

    await db.runSync('UPDATE t_task SET status = 5 WHERE id = ?', [order.task_id]);
    await db.runSync('UPDATE t_order SET status = 6 WHERE id = ?', [orderId]);

    res.json({ code: 0, message: '投诉已提交' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
