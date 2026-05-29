const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.post('/freeze', authMiddleware, (req, res) => {
  const { order_id, amount } = req.body;

  const order = db.prepare('SELECT * FROM t_order WHERE id = ?').get(order_id);
  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }

  res.json({ code: 0, message: '资金冻结成功', data: { frozen: amount } });
});

router.post('/unfreeze', authMiddleware, (req, res) => {
  const { order_id } = req.body;

  res.json({ code: 0, message: '资金解冻成功' });
});

router.post('/pay', authMiddleware, (req, res) => {
  const { order_id } = req.body;

  const now = new Date().toISOString();
  db.prepare('UPDATE t_order SET pay_time = ? WHERE id = ?').run(now, order_id);

  res.json({ code: 0, message: '支付成功' });
});

router.post('/refund', authMiddleware, (req, res) => {
  const { order_id, amount } = req.body;

  res.json({ code: 0, message: '退款成功', data: { refunded: amount } });
});

module.exports = router;