const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');

router.post('/image', authMiddleware, (req, res, next) => {
  req.uploadType = 'images';
  next();
}, uploadMiddleware.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, message: '请选择图片文件' });
  }

  const url = `${process.env.BASE_URL}/uploads/images/${req.file.filename}`;
  res.json({ code: 0, message: '上传成功', data: { url } });
});

router.post('/avatar', authMiddleware, (req, res, next) => {
  req.uploadType = 'avatars';
  next();
}, uploadMiddleware.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, message: '请选择图片文件' });
  }

  const url = `${process.env.BASE_URL}/uploads/avatars/${req.file.filename}`;

  const db = require('../db');
  const now = new Date().toISOString();
  db.prepare('UPDATE t_user SET avatar_url = ?, updated_at = ? WHERE id = ?')
    .run(url, now, req.user.id);

  res.json({ code: 0, message: '上传成功', data: { url } });
});

router.post('/voice', authMiddleware, (req, res, next) => {
  req.uploadType = 'voices';
  next();
}, uploadMiddleware.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, message: '请选择语音文件' });
  }

  const url = `${process.env.BASE_URL}/uploads/voices/${req.file.filename}`;
  res.json({ code: 0, message: '上传成功', data: { url } });
});

router.post('/task-images', authMiddleware, (req, res, next) => {
  req.uploadType = 'task_images';
  next();
}, uploadMiddleware.array('files', 9), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ code: 400, message: '请选择图片文件' });
  }

  const urls = req.files.map(f => `${process.env.BASE_URL}/uploads/task_images/${f.filename}`);
  res.json({ code: 0, message: '上传成功', data: { urls } });
});

module.exports = router;