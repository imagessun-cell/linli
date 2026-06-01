const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

router.post('/freeze', authMiddleware, async (req, res) => {
  try {
    const { order_id, amount } = req.body;

    const order = await db.getSync('SELECT * FROM t_order WHERE id = ?', [order_id]);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }

    res.json({ code: 0, message: '资金冻结成功', data: { frozen: amount } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/unfreeze', authMiddleware, async (req, res) => {
  try {
    const { order_id } = req.body;
    res.json({ code: 0, message: '资金解冻成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/pay', authMiddleware, async (req, res) => {
  try {
    const { order_id } = req.body;
    const now = new Date().toISOString();
    await db.runSync('UPDATE t_order SET pay_time = ? WHERE id = ?', [now, order_id]);
    res.json({ code: 0, message: '支付成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/refund', authMiddleware, async (req, res) => {
  try {
    const { order_id, amount } = req.body;
    res.json({ code: 0, message: '退款成功', data: { refunded: amount } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
