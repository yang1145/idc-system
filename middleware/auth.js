// 用户认证中间件
const requireUserAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '需要用户认证' });
  }
  
  try {
    const token = authHeader.substring(7);
    const decoded = JSON.parse(atob(token));
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};

// 管理员认证中间件
const requireAdminAuth = (req, res, next) => {
  // 这里应该实现管理员认证逻辑
  next();
};

module.exports = {
  requireUserAuth,
  requireAdminAuth
};