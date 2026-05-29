const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const init = (server) => {
  io = new Server(server, {
    cors: { origin: '*' }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('未授权'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('token无效'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`用户 ${socket.user.id} 已连接`);

    socket.join(`user_${socket.user.id}`);

    socket.on('send_message', (data) => {
      const { to_user_id, content, type = 1 } = data;
      const db = require('../db');
      const now = new Date().toISOString();

      const result = db.prepare(`
        INSERT INTO t_message (from_user_id, to_user_id, content, type, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(socket.user.id, to_user_id, content, type, now);

      const message = db.prepare('SELECT * FROM t_message WHERE id = ?').get(result.lastInsertRowid);

      io.to(`user_${to_user_id}`).emit('new_message', message);
      socket.emit('message_sent', message);
    });

    socket.on('join_order_room', (orderId) => {
      socket.join(`order_${orderId}`);
    });

    socket.on('order_status_update', (data) => {
      const { order_id, status } = data;
      io.to(`order_${order_id}`).emit('order_status_changed', { order_id, status });
    });

    socket.on('disconnect', () => {
      console.log(`用户 ${socket.user.id} 已断开`);
    });
  });

  return io;
};

const getIO = () => io;

module.exports = { init, getIO };