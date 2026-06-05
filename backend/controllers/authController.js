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
  try {
    const { phone, password, role = 1 } = req.body;
    if (!phone) {
      return res.status(400).json({ code: 400, message: '手机号不能为空' });
    }

    const existingUser = await db.getSync('SELECT * FROM t_user WHERE phone = ?', [phone]);
    if (existingUser) {
      return res.status(400).json({ code: 400, message: '手机号已注册' });
    }

    const now = new Date().toISOString();
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const result = await db.runSync(
      `INSERT INTO t_user (phone, nickname, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [phone, `用户${phone.slice(-4)}`, role, now, now]
    );

    const user = await db.getSync('SELECT * FROM t_user WHERE id = ?', [result.lastInsertRowid]);

    const token = generateToken(user);

    if (role === 1) {
      const workerResult = await db.runSync(
        'INSERT INTO t_worker (user_id, age, community, skills) VALUES (?, 0, ?, ?)',
        [user.id, '', '[]']
      );
      await db.runSync('INSERT INTO t_wallet (worker_id) VALUES (?)', [workerResult.lastInsertRowid]);
    } else if (role === 2) {
      await db.runSync('INSERT INTO t_employer (user_id) VALUES (?)', [user.id]);
    }

    res.json({
      code: 0,
      message: '注册成功',
      data: { token, user: { id: user.id, phone: user.phone, nickname: user.nickname, role: user.role } }
    });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

const login = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone) {
      return res.status(400).json({ code: 400, message: '手机号不能为空' });
    }

    if (code !== '123456' && code !== undefined) {
      return res.status(400).json({ code: 400, message: '验证码错误，本地Mock为123456' });
    }

    let user = await db.getSync('SELECT * FROM t_user WHERE phone = ?', [phone]);
    if (!user) {
      const now = new Date().toISOString();
      const result = await db.runSync(
        `INSERT INTO t_user (phone, nickname, role, created_at, updated_at)
         VALUES (?, ?, 1, ?, ?)`,
        [phone, `用户${phone.slice(-4)}`, now, now]
      );
      user = await db.getSync('SELECT * FROM t_user WHERE id = ?', [result.lastInsertRowid]);
      const workerResult = await db.runSync(
        'INSERT INTO t_worker (user_id, age, community, skills) VALUES (?, 0, ?, ?)',
        [user.id, '', '[]']
      );
      await db.runSync('INSERT INTO t_wallet (worker_id) VALUES (?)', [workerResult.lastInsertRowid]);
    }

    const token = generateToken(user);

    res.json({
      code: 0,
      message: '登录成功',
      data: { token, user: { id: user.id, phone: user.phone, nickname: user.nickname, role: user.role } }
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await db.getSync('SELECT * FROM t_user WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    delete user.id_card;

    if (user.role === 1) {
      const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ?', [user.id]);
      user.worker = worker;
    } else if (user.role === 2) {
      const employer = await db.getSync('SELECT * FROM t_employer WHERE user_id = ?', [user.id]);
      user.employer = employer;
    }

    res.json({ code: 0, message: 'success', data: user });
  } catch (err) {
    console.error('获取个人资料失败:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { nickname, avatar_url } = req.body;
    const now = new Date().toISOString();

    await db.runSync(
      'UPDATE t_user SET nickname = ?, avatar_url = ?, updated_at = ? WHERE id = ?',
      [nickname, avatar_url, now, req.user.id]
    );

    const user = await db.getSync('SELECT * FROM t_user WHERE id = ?', [req.user.id]);
    res.json({ code: 0, message: '更新成功', data: user });
  } catch (err) {
    console.error('更新个人资料失败:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

const realname = async (req, res) => {
  try {
    const { real_name, id_card } = req.body;
    const now = new Date().toISOString();

    await db.runSync(
      'UPDATE t_user SET real_name = ?, id_card = ?, face_verified = 1, updated_at = ? WHERE id = ?',
      [real_name, id_card, now, req.user.id]
    );

    res.json({ code: 0, message: '实名认证成功' });
  } catch (err) {
    console.error('实名认证失败:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

const switchRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (![1, 2, 3].includes(role)) {
      return res.status(400).json({ code: 400, message: '无效的角色' });
    }

    const now = new Date().toISOString();
    await db.runSync(
      'UPDATE t_user SET role = ?, updated_at = ? WHERE id = ?',
      [role, now, req.user.id]
    );

    if (role === 1) {
      const worker = await db.getSync('SELECT * FROM t_worker WHERE user_id = ?', [req.user.id]);
      if (!worker) {
        const workerResult = await db.runSync(
          'INSERT INTO t_worker (user_id, age, community, skills) VALUES (?, 0, ?, ?)',
          [req.user.id, '', '[]']
        );
        await db.runSync('INSERT INTO t_wallet (worker_id) VALUES (?)', [workerResult.lastInsertRowid]);
      }
    } else if (role === 2) {
      const employer = await db.getSync('SELECT * FROM t_employer WHERE user_id = ?', [req.user.id]);
      if (!employer) {
        await db.runSync('INSERT INTO t_employer (user_id) VALUES (?)', [req.user.id]);
      }
    }

    const user = await db.getSync('SELECT * FROM t_user WHERE id = ?', [req.user.id]);
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ code: 0, message: '角色切换成功', data: { token, role: user.role } });
  } catch (err) {
    console.error('切换角色失败:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

module.exports = { register, login, getProfile, updateProfile, realname, switchRole };
