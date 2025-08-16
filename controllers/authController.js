const bcrypt = require('bcryptjs');
const svgCaptcha = require('svg-captcha');

const userDao = require('../db/userDao');
const smsDao = require('../db/smsDao');
const captchaDao = require('../db/captchaDao');
const adminDao = require('../db/adminDao');

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
  
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: '邮箱格式不正确'
    });
  }
  
  try {
    // 验证短信验证码
    const isCodeValid = await smsDao.verifySmsCode(phone, smsCode);
    if (!isCodeValid) {
      return res.status(400).json({
        success: false,
        message: '短信验证码错误或已过期'
      });
    }
    
    // 检查用户名是否已存在
    const isUsernameExists = await userDao.checkUsernameExists(username);
    if (isUsernameExists) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
    
    // 检查手机号是否已存在
    const isPhoneExists = await userDao.checkPhoneExists(phone);
    if (isPhoneExists) {
      return res.status(400).json({
        success: false,
        message: '手机号已存在'
      });
    }
    
    // 对密码进行加密
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // 创建用户
    const userData = {
      username,
      password: hashedPassword,
      phone,
      email: email || null
    };
    
    const user = await userDao.createUser(userData);
    
    // 删除已使用的验证码
    await smsDao.deleteSmsCode(phone, smsCode);
    
    // 生成用户令牌
    const token = generateUserToken(user);
    
    res.json({
      success: true,
      message: '注册成功',
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
    console.error('用户注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败'
    });
  }
}

// 用户名/密码登录
async function login(req, res) {
  const { login: userLogin, password } = req.body;
  
  // 验证参数
  if (!userLogin || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名/手机号和密码是必填项'
    });
  }
  
  try {
    // 根据用户名或手机号查找用户
    const user = await userDao.findUserByLogin(userLogin);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名/手机号或密码错误'
      });
    }
    
    // 验证密码
    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      return res.status(401).json({
        success: false,
        message: '用户名/手机号或密码错误'
      });
    }
    
    // 生成用户令牌
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
    console.error('用户登录错误:', error);
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
    const isCodeValid = await smsDao.verifySmsCode(phone, smsCode);
    if (!isCodeValid) {
      return res.status(400).json({
        success: false,
        message: '短信验证码错误或已过期'
      });
    }
    
    // 根据手机号查找用户
    let user = await userDao.findUserByPhone(phone);
    
    // 如果用户不存在，则创建新用户
    if (!user) {
      const username = 'user' + Date.now(); // 生成默认用户名
      const password = 'sms' + Date.now(); // 生成默认密码
      
      // 对密码进行加密
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // 创建用户
      const userData = {
        username,
        password: hashedPassword,
        phone,
        email: null
      };
      
      user = await userDao.createUser(userData);
    }
    
    // 删除已使用的验证码
    await smsDao.deleteSmsCode(phone, smsCode);
    
    // 生成用户令牌
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
function getCaptcha(req, res) {
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0o1i',
    noise: 2,
    color: true,
    background: '#f0f0f0'
  });
  
  const captchaId = 'captcha_' + Date.now();
  
  // 保存验证码到内存（实际项目中应保存到数据库或Redis）
  global.captchas = global.captchas || {};
  global.captchas[captchaId] = captcha.text.toLowerCase();
  
  // 设置5分钟后过期
  setTimeout(() => {
    delete global.captchas[captchaId];
  }, 5 * 60 * 1000);
  
  res.json({
    success: true,
    data: {
      svg: captcha.data,
      id: captchaId
    }
  });
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
  verifyUserTokenEndpoint
};