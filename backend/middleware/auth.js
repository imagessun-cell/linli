const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log('=== Auth Middleware ===');
  console.log('Full auth header:', req.headers.authorization);

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('No authorization header');
    return res.status(401).json({ code: 401, message: '未登录 - 无token' });
  }

  const parts = authHeader.split(' ');
  console.log('Auth parts:', parts);

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('Invalid auth format');
    return res.status(401).json({ code: 401, message: 'token格式错误' });
  }

  const token = parts[1];
  console.log('Token:', token ? token.substring(0, 30) + '...' : 'empty');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded payload:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    return res.status(401).json({ code: 401, message: 'token无效: ' + err.message });
  }
};