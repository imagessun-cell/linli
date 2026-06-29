const db = require('../db');

const sendOrderDynamic = async (req, {
  order,
  fromUserId,
  toUserId,
  serviceName = '陪诊服务',
  statusText = '状态已更新',
  amount
}) => {
  if (!order || !fromUserId || !toUserId || Number(fromUserId) === Number(toUserId)) {
    return null;
  }

  const now = new Date().toISOString();
  const orderNo = order.order_no ? ` · ${order.order_no}` : '';
  const amountText = amount !== undefined && amount !== null ? ` · ¥${Number(amount).toFixed(2)}` : '';
  const content = `[订单动态] ${serviceName} · ${statusText}${orderNo}${amountText}`;

  const result = await db.runSync(`
    INSERT INTO t_message (from_user_id, to_user_id, content, type, created_at)
    VALUES (?, ?, ?, 3, ?)
  `, [fromUserId, toUserId, content, now]);

  const message = await db.getSync(`
    SELECT m.*, u.nickname as from_nickname, u.avatar_url as from_avatar
    FROM t_message m
    JOIN t_user u ON m.from_user_id = u.id
    WHERE m.id = ?
  `, [result.lastInsertRowid]);

  try {
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${toUserId}`).emit('new_message', message);
      io.to(`user_${fromUserId}`).emit('message_sent', message);
    }
  } catch (e) {
    console.error('order dynamic socket emit error:', e);
  }

  return message;
};

module.exports = { sendOrderDynamic };
