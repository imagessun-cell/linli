const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, phone: user.phone, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const register = async (req, res) => {
  const { phone, password, role = 1 } = req.body;
  if (!phone) {
    return res.status(400).json({ code: 400, message: '手机号不能为空' });
  }

  const existingUser = db.prepare('SELECT * FROM t_user WHERE phone = ?').get(phone);
  if (existingUser) {
    return res.status(400).json({ code: 400, message: '手机号已注册' });
  }

  const now = new Date().toISOString();
  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

  const stmt = db.prepare(`
    INSERT INTO t_user (phone, nickname, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(phone, `用户${phone.slice(-4)}`, role, now, now);
  const user = db.prepare('SELECT * FROM t_user WHERE id = ?').get(result.lastInsertRowid);

  const token = generateToken(user);

  if (role === 1) {
    db.prepare('INSERT INTO t_worker (user_id, age, community, skills) VALUES (?, 0, ?, ?)').run(user.id, '', '[]');
    db.prepare('INSERT INTO t_wallet (worker_id) VALUES (?)').run(user.id);
  } else if (role === 2) {
    db.prepare('INSERT INTO t_employer (user_id) VALUES (?)').run(user.id);
  }

  res.json({
    code: 0,
    message: '注册成功',
    data: { token, user: { id: user.id, phone: user.phone, nickname: user.nickname, role: user.role } }
  });
};

const login = async (req, res) => {
  const { phone, code } = req.body;
  if (!phone) {
    return res.status(400).json({ code: 400, message: '手机号不能为空' });
  }

  if (code !== '123456' && code !== undefined) {
    return res.status(400).json({ code: 400, message: '验证码错误，本地Mock为123456' });
  }

  let user = db.prepare('SELECT * FROM t_user WHERE phone = ?').get(phone);
  if (!user) {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO t_user (phone, nickname, role, created_at, updated_at)
      VALUES (?, ?, 1, ?, ?)
    `);
    const result = stmt.run(phone, `用户${phone.slice(-4)}`, now, now);
    user = db.prepare('SELECT * FROM t_user WHERE id = ?').get(result.lastInsertRowid);
    db.prepare('INSERT INTO t_worker (user_id, age, community, skills) VALUES (?, 0, ?, ?)').run(user.id, '', '[]');
    db.prepare('INSERT INTO t_wallet (worker_id) VALUES (?)').run(user.id);
  }

  const token = generateToken(user);

  res.json({
    code: 0,
    message: '登录成功',
    data: { token, user: { id: user.id, phone: user.phone, nickname: user.nickname, role: user.role } }
  });
};

const getProfile = (req, res) => {
  const user = db.prepare('SELECT * FROM t_user WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }

  delete user.id_card;

  if (user.role === 1) {
    const worker = db.prepare('SELECT * FROM t_worker WHERE user_id = ?').get(user.id);
    user.worker = worker;
  } else if (user.role === 2) {
    const employer = db.prepare('SELECT * FROM t_employer WHERE user_id = ?').get(user.id);
    user.employer = employer;
  }

  res.json({ code: 0, message: 'success', data: user });
};

const updateProfile = (req, res) => {
  const { nickname, avatar_url } = req.body;
  const now = new Date().toISOString();

  db.prepare('UPDATE t_user SET nickname = ?, avatar_url = ?, updated_at = ? WHERE id = ?')
    .run(nickname, avatar_url, now, req.user.id);

  const user = db.prepare('SELECT * FROM t_user WHERE id = ?').get(req.user.id);
  res.json({ code: 0, message: '更新成功', data: user });
};

const realname = (req, res) => {
  const { real_name, id_card } = req.body;
  const now = new Date().toISOString();

  db.prepare('UPDATE t_user SET real_name = ?, id_card = ?, face_verified = 1, updated_at = ? WHERE id = ?')
    .run(real_name, id_card, now, req.user.id);

  res.json({ code: 0, message: '实名认证成功' });
};

const switchRole = (req, res) => {
  const { role } = req.body;
  if (![1, 2, 3].includes(role)) {
    return res.status(400).json({ code: 400, message: '无效的角色' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE t_user SET role = ?, updated_at = ? WHERE id = ?').run(role, now, req.user.id);

  if (role === 1) {
    const worker = db.prepare('SELECT * FROM t_worker WHERE user_id = ?').get(req.user.id);
    if (!worker) {
      db.prepare('INSERT INTO t_worker (user_id, age, community, skills) VALUES (?, 0, ?, ?)').run(req.user.id, '', '[]');
      db.prepare('INSERT INTO t_wallet (worker_id) VALUES (?)').run(req.user.id);
    }
  } else if (role === 2) {
    const employer = db.prepare('SELECT * FROM t_employer WHERE user_id = ?').get(req.user.id);
    if (!employer) {
      db.prepare('INSERT INTO t_employer (user_id) VALUES (?)').run(req.user.id);
    }
  }

  const user = db.prepare('SELECT * FROM t_user WHERE id = ?').get(req.user.id);
  const token = jwt.sign(
    { id: user.id, phone: user.phone, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ code: 0, message: '角色切换成功', data: { token, role: user.role } });
};

module.exports = { register, login, getProfile, updateProfile, realname, switchRole };