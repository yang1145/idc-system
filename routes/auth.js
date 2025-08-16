const express = require('express');
const router = express.Router();

const {
  sendSms,
  register,
  login,
  loginSms,
  getCaptcha,
  verifyCaptcha,
  adminLogin,
  requireUserAuth,
  requireAdminAuth
} = require('../controllers/authController');

// 发送短信验证码
router.post('/send-sms', sendSms);

// 用户注册
router.post('/register', register);

// 用户名/密码登录
router.post('/login', login);

// 短信验证码登录
router.post('/login-sms', loginSms);

// 生成图像验证码
router.get('/captcha', getCaptcha);

// 验证图像验证码（用于测试）
router.post('/verify-captcha', verifyCaptcha);

// 管理员登录
router.post('/admin/login', adminLogin);

module.exports = router;
module.exports.requireUserAuth = requireUserAuth;
module.exports.requireAdminAuth = requireAdminAuth;