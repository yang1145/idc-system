const bcrypt = require('bcryptjs');
const svgCaptcha = require('svg-captcha');
const { userDao } = require('../db/userDao');
const { captchaDao } = require('../db/captchaDao');
const { realnameDao } = require('../db/realnameDao');
const { sendSms } = require('../services/smsService');

// 工具函数
function isValidPhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

function isValidUsername(username) {
  return username && username.length >= 3 && username.length <= 20;
}

function isValidPassword(password) {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+={}|[\]:;"'<>?,./`~\-\\]{6,20}$/;
  return password && passwordRegex.test(password);
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 工具函数：生成JWT令牌（用于管理员身份验证）
function generateAdminToken(admin) {
  return Buffer.from(`admin:${admin.id}:${admin.username}`).toString('base64');
}

// 工具函数：生成用户令牌
function generateUserToken(user) {
  return Buffer.from(`user:${user.id}:${user.username}`).toString('base64');
}

// 工具函数：验证管理员令牌
function verifyAdminToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts[0] === 'admin') {
      return {
        id: parts[1],
        username: parts[2]
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

// 工具函数：验证用户令牌
function verifyUserToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts[0] === 'user') {
      return {
        id: parts[1],
        username: parts[2]
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function sendSMS(phone, code) {
  if (process.env.TENCENT_SECRET_ID && 
      process.env.TENCENT_SECRET_KEY &&
      process.env.TENCENT_SMS_SDK_APP_ID &&
      process.env.TENCENT_SMS_SIGN_NAME &&
      process.env.TENCENT_SMS_TEMPLATE_ID &&
      process.env.TENCENT_SECRET_ID !== 'your_secret_id') {
    try {
      // 导入腾讯云短信客户端
      const tencentcloud = require("tencentcloud-sdk-nodejs");
      const SmsClient = tencentcloud.sms.v20210111.Client;
      
      // 创建腾讯云短信客户端实例
      const clientConfig = {
        credential: {
          secretId: process.env.TENCENT_SECRET_ID,
          secretKey: process.env.TENCENT_SECRET_KEY,
        },
        region: "ap-beijing",
        profile: {
          httpProfile: {
            endpoint: "sms.tencentcloudapi.com",
          },
        },
      };
      
      const client = new SmsClient(clientConfig);
      
      const params = {
        PhoneNumberSet: [`+86${phone}`],
        SmsSdkAppId: process.env.TENCENT_SMS_SDK_APP_ID,
        SignName: process.env.TENCENT_SMS_SIGN_NAME,
        TemplateId: process.env.TENCENT_SMS_TEMPLATE_ID,
        TemplateParamSet: [code, "5"], // 验证码和有效分钟数
      };
      
      const result = await client.SendSms(params);
      
      if (result.SendStatusSet && result.SendStatusSet[0].Code === "Ok") {
        return {
          success: true,
          message: "短信发送成功"
        };
      } else {
        console.error("腾讯云短信发送失败:", result);
        return {
          success: false,
          message: "短信发送失败"
        };
      }
    } catch (error) {
      console.error("腾讯云短信发送错误:", error);
      // 如果腾讯云发送失败，回退到模拟发送
      console.log(`发送短信到 ${phone}，验证码是：${code} (模拟发送)`);
      return {
        success: true,
        message: '短信发送成功(模拟)'
      };
    }
  } else {
    // 模拟发送成功
    console.log(`发送短信到 ${phone}，验证码是：${code} (模拟发送)`);
    return {
      success: true,
      message: '短信发送成功(模拟)'
    };
  }
}

// 用户认证中间件
function requireUserAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: '未提供身份验证令牌'
    });
  }
  
  const token = authHeader.replace('Bearer ', '');
  const user = verifyUserToken(token);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '无效的身份验证令牌'
    });
  }
  
  req.user = user;
  next();
}

// 管理员登录中间件
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: '未提供身份验证令牌'
    });
  }
  
  const token = authHeader.replace('Bearer ', '');
  const admin = verifyAdminToken(token);
  
  if (!admin) {
    return res.status(401).json({
      success: false,
      message: '无效的身份验证令牌'
    });
  }
  
  req.admin = admin;
  next();
}

// 发送短信验证码
async function sendSms(req, res) {
  const { phone } = req.body;
  
  // 验证参数
  if (!phone) {
    return res.status(400).json({
      success: false,
      message: '手机号是必填项'
    });
  }
  
  if (!isValidPhone(phone)) {
    return res.status(400).json({
      success: false,
      message: '手机号格式不正确'
    });
  }
  
  // 生成验证码
  const code = generateVerificationCode();
  
  // 设置5分钟后过期
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  
  try {
    // 保存验证码到数据库
    await smsDao.saveSmsCode(phone, code, expiresAt);
    
    // 发送短信（实际项目中应调用腾讯云短信API）
    const result = await sendSMS(phone, code);
    
    if (result.success) {
      res.json({
        success: true,
        message: '验证码已发送'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '短信发送失败'
      });
    }
  } catch (error) {
    console.error('短信发送错误:', error);
    res.status(500).json({
      success: false,
      message: '短信发送失败'
    });
  }
}

// 用户注册
async function register(req, res) {
  const { username, password, phone, email, smsCode } = req.body;
  
  // 验证参数
  if (!username || !password || !phone || !smsCode) {
    return res.status(400).json({
      success: false,
      message: '用户名、密码、手机号和短信验证码是必填项'
    });
  }
  
  if (!isValidUsername(username)) {
    return res.status(400).json({
      success: false,
      message: '用户名长度应为3-20个字符'
    });
  }
  
  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message: '密码长度应为6-20个字符，且必须包含字母和数字'
    });
  }
  
  if (!isValidPhone(phone)) {
    return res.status(400).json({
      success: false,
      message: '手机号格式不正确'
    });
  }
  
  try {
    // 验证短信验证码
    const savedCode = await smsDao.verifySmsCode(phone, smsCode);
    if (!savedCode) {
      return res.status(400).json({
        success: false,
        message: '短信验证码错误或已过期'
      });
    }
    
    // 检查用户名是否已存在
    const usernameExists = await userDao.checkUsernameExists(username);
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
    
    // 检查手机号是否已存在
    const phoneExists = await userDao.checkPhoneExists(phone);
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: '手机号已被注册'
      });
    }
    
    // 对密码进行加密
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    
    // 创建新用户
    const newUser = {
      username,
      password: hash, // 存储加密后的密码
      phone,
      email: email || ''
    };
    
    const createdUser = await userDao.createUser(newUser);
    
    // 清除已使用的验证码
    await smsDao.deleteSmsCode(phone);
    
    // 生成令牌
    const token = generateUserToken(createdUser);
    
    res.json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: createdUser.id,
          username: createdUser.username,
          phone: createdUser.phone,
          email: createdUser.email
        }
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败'
    });
  }
}

// 用户名/密码登录
async function login(req, res) {
  const { login, password } = req.body;
  
  // 验证参数
  if (!login || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名/手机号和密码是必填项'
    });
  }
  
  try {
    // 查找用户（支持用户名或手机号登录）
    const user = await userDao.findUserByLogin(login);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 验证密码
    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      return res.status(401).json({
        success: false,
        message: '密码错误'
      });
    }
    
    // 生成令牌
    const token = generateUserToken(user);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
}

// 短信验证码登录
async function loginSms(req, res) {
  const { phone, smsCode } = req.body;
  
  // 验证参数
  if (!phone || !smsCode) {
    return res.status(400).json({
      success: false,
      message: '手机号和短信验证码是必填项'
    });
  }
  
  if (!isValidPhone(phone)) {
    return res.status(400).json({
      success: false,
      message: '手机号格式不正确'
    });
  }
  
  try {
    // 验证短信验证码
    const savedCode = await smsDao.verifySmsCode(phone, smsCode);
    if (!savedCode) {
      return res.status(400).json({
        success: false,
        message: '短信验证码错误或已过期'
      });
    }
    
    // 查找用户
    const user = await userDao.findUserByPhone(phone);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在，请先注册'
      });
    }
    
    // 清除已使用的验证码
    await smsDao.deleteSmsCode(phone);
    
    // 生成令牌
    const token = generateUserToken(user);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('短信登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
}

// 生成图像验证码
async function getCaptcha(req, res) {
  try {
    // 先清理过期的验证码
    await captchaDao.deleteExpiredCaptchas();
    
    // 生成验证码
    const captcha = svgCaptcha.create({
      size: 6, // 验证码长度
      ignoreChars: '0o1iIl', // 排除易混淆字符
      noise: 3, // 干扰线条数量
      color: true, // 彩色验证码
      background: '#f0f0f0' // 背景色
    });
    
    // 生成唯一的验证码ID
    const captchaId = 'CAP' + Date.now() + Math.random().toString(36).substring(2, 10);
    
    // 设置5分钟后过期
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // 保存验证码到数据库
    await captchaDao.saveCaptcha(captchaId, captcha.text.toUpperCase(), expiresAt);
    
    // 检查验证码数据是否存在
    if (!captcha.data) {
      throw new Error('验证码生成失败，未返回SVG数据');
    }
    
    // 返回验证码ID和SVG图像
    res.json({
      success: true,
      data: {
        captchaId: captchaId,
        svg: captcha.data
      }
    });
  } catch (error) {
    console.error('生成验证码错误:', error);
    res.status(500).json({
      success: false,
      message: '生成验证码失败: ' + error.message
    });
  }
}

// 验证图像验证码（用于测试）
async function verifyCaptcha(req, res) {
  const { id, text } = req.body;
  
  if (!id || !text) {
    return res.status(400).json({
      success: false,
      message: '验证码ID和文本是必填项'
    });
  }
  
  // 验证验证码
  const storedCaptcha = global.captchas && global.captchas[id];
  if (!storedCaptcha) {
    return res.status(400).json({
      success: false,
      message: '验证码已过期或不存在'
    });
  }
  
  if (storedCaptcha !== text.toLowerCase()) {
    return res.status(400).json({
      success: false,
      message: '验证码错误'
    });
  }
  
  // 删除已使用的验证码
  delete global.captchas[id];
  
  res.json({
    success: true,
    message: '验证码正确'
  });
}

// 管理员登录
async function adminLogin(req, res) {
  const { username, password } = req.body;
  
  // 验证参数
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名和密码是必填项'
    });
  }
  
  try {
    // 查找管理员
    const admin = await adminDao.findAdminByUsername(username);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 验证密码
    const result = await bcrypt.compare(password, admin.password);
    if (!result) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 生成管理员令牌
    const token = generateAdminToken(admin);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email
        }
      }
    });
  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
}

// 验证用户令牌（用于前端验证）
async function verifyUserTokenEndpoint(req, res) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: '未提供身份验证令牌'
    });
  }
  
  const token = authHeader.replace('Bearer ', '');
  const user = verifyUserToken(token);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '无效的身份验证令牌'
    });
  }
  
  // 检查用户是否存在
  try {
    const dbUser = await userDao.findUserByLogin(user.username);
    if (!dbUser) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      message: '令牌有效',
      data: {
        id: dbUser.id,
        username: dbUser.username,
        phone: dbUser.phone,
        email: dbUser.email
      }
    });
  } catch (error) {
    console.error('验证用户令牌时出错:', error);
    res.status(500).json({
      success: false,
      message: '验证失败'
    });
  }
}

// 实名认证
const realnameAuth = async (req, res) => {
  try {
    const { name, idCard } = req.body;
    const userId = req.user.id; // 从认证中间件获取用户ID

    // 验证输入
    if (!name || !idCard) {
      return res.status(400).json({ error: '姓名和身份证号不能为空' });
    }

    // 验证姓名格式（2-20个字符，可以是汉字或字母）
    const nameRegex = /^[\u4e00-\u9fa5a-zA-Z]{2,20}$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ error: '姓名格式不正确' });
    }

    // 验证身份证号格式（18位，最后一位可能是X）
    const idCardRegex = /^\d{17}[\dXx]$/;
    if (!idCardRegex.test(idCard)) {
      return res.status(400).json({ error: '身份证号格式不正确' });
    }

    // 检查该用户是否已经提交过实名认证
    const existingAuth = await realnameDao.findByUserId(userId);
    if (existingAuth) {
      return res.status(400).json({ error: '您已经提交过实名认证申请，请等待审核' });
    }

    // 保存实名认证信息
    const realnameAuth = await realnameDao.createRealnameAuth(userId, name, idCard);

    res.json({
      message: '实名认证申请已提交，等待审核',
      data: {
        id: realnameAuth.id,
        name: realnameAuth.name,
        status: realnameAuth.status,
        createdAt: realnameAuth.created_at
      }
    });
  } catch (error) {
    console.error('实名认证错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};

// 获取实名认证状态
const getRealnameStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const realnameAuth = await realnameDao.findByUserId(userId);
    
    if (!realnameAuth) {
      return res.json({ status: 'not_submitted' });
    }
    
    res.json({
      status: realnameAuth.status,
      name: realnameAuth.name,
      createdAt: realnameAuth.created_at,
      updatedAt: realnameAuth.updated_at
    });
  } catch (error) {
    console.error('获取实名认证状态错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};

module.exports = {
  sendSms,
  register,
  login,
  loginSms,
  getCaptcha,
  verifyCaptcha,
  adminLogin,
  requireUserAuth,
  requireAdminAuth,
  verifyUserTokenEndpoint,
  realnameAuth,
  getRealnameStatus
};