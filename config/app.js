// 应用配置
module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  
  // 短信服务配置
  sms: {
    enabled: process.env.SMS_ENABLED === 'true',
    secretId: process.env.SMS_SECRET_ID || '',
    secretKey: process.env.SMS_SECRET_KEY || '',
    endpoint: process.env.SMS_ENDPOINT || '',
    region: process.env.SMS_REGION || '',
    appId: process.env.SMS_APP_ID || '',
    signName: process.env.SMS_SIGN_NAME || '',
    templateId: process.env.SMS_TEMPLATE_ID || ''
  },
  
  // 微信支付配置
  wechatPay: {
    enabled: process.env.WECHAT_PAY_ENABLED === 'true',
    appId: process.env.WECHAT_PAY_APP_ID || '',
    mchId: process.env.WECHAT_PAY_MCH_ID || '',
    apiKey: process.env.WECHAT_PAY_API_KEY || '',
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || ''
  },
  
  // 支付宝配置
  alipay: {
    enabled: process.env.ALIPAY_ENABLED === 'true',
    appId: process.env.ALIPAY_APP_ID || '',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || ''
  },
  
  // 安全配置
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
    tokenSecret: process.env.TOKEN_SECRET || 'idc-default-secret'
  }
};