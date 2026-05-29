require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIO = require('./socket');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const workerRoutes = require('./routes/worker');
const employerRoutes = require('./routes/employer');
const taskRoutes = require('./routes/task');
const orderRoutes = require('./routes/order');
const messageRoutes = require('./routes/message');
const trainingRoutes = require('./routes/training');
const communityRoutes = require('./routes/community');
const paymentRoutes = require('./routes/payment');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const locationRoutes = require('./routes/location');

const app = express();
const server = http.createServer(app);

const io = socketIO.init(server);
app.set('io', io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/location', locationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'OK', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ code: 500, message: '服务器错误' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`邻里服务已启动，端口: ${PORT}`);
});

module.exports = app;