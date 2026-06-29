const db = require('../db');

const formatDateTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const formatServiceTime = (start, end) => {
  if (!start) return '';
  if (!end) return formatDateTime(start);
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return '';
  const endText = startDate.toDateString() === endDate.toDateString()
    ? `${endDate.getHours()}:${String(endDate.getMinutes()).padStart(2, '0')}`
    : formatDateTime(end);
  return `${formatDateTime(start)} - ${endText}`;
};

const inferNextAction = (statusText = '') => {
  if (statusText.includes('待报价') || statusText.includes('等待陪诊师报价')) return '等待陪诊师确认最终报价';
  if (statusText.includes('待支付') || statusText.includes('等待就诊人支付')) return '就诊人确认报价并完成支付';
  if (statusText.includes('已付款') || statusText.includes('待服务')) return '陪诊师按约定时间到达就诊人地点';
  if (statusText.includes('服务已开始')) return '陪诊师同步陪诊进度并完成服务报告';
  if (statusText.includes('等待就诊人确认')) return '就诊人确认服务完成并评价';
  if (statusText.includes('已确认完成') || statusText.includes('已评价')) return '订单已闭环';
  if (statusText.includes('取消')) return '订单已结束';
  return '';
};

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
  const task = order.task_id
    ? await db.getSync(
      'SELECT address, target_hospital, start_time, end_time, special_requirements FROM t_task WHERE id = ?',
      [order.task_id]
    ).catch(() => null)
    : null;
  const routeText = [task?.address || order.address, task?.target_hospital || order.target_hospital]
    .filter(Boolean)
    .join(' → ');
  const timeText = formatServiceTime(task?.start_time || order.start_time, task?.end_time || order.end_time);
  const requirement = task?.special_requirements || order.special_requirements || '';
  const amountText = amount !== undefined && amount !== null ? `¥${Number(amount).toFixed(2)}` : '';
  const content = [
    '[订单动态]',
    `服务：${serviceName}`,
    `状态：${statusText}`,
    order.id ? `订单ID：${order.id}` : '',
    order.order_no ? `订单：${order.order_no}` : '',
    amountText ? `金额：${amountText}` : '',
    routeText ? `路线：${routeText}` : '',
    timeText ? `时间：${timeText}` : '',
    requirement ? `要求：${requirement}` : '',
    inferNextAction(statusText) ? `下一步：${inferNextAction(statusText)}` : ''
  ].filter(Boolean).join('\n');

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
