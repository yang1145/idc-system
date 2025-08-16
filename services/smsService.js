// 短信服务
const { sms } = require('../config/app');
let SmsClient;

// 检查是否配置了短信服务
if (sms.enabled && sms.secretId && sms.secretKey) {
  // 实际的腾讯云短信服务
  const tencentcloud = require('@tencentcloud/sms-sdk');
  SmsClient = class {
    constructor() {
      this.client = new tencentcloud.sms.v20210111.Client({
        credential: {
          secretId: sms.secretId,
          secretKey: sms.secretKey,
        },
        region: sms.region,
        profile: {
          httpProfile: {
            endpoint: sms.endpoint
          }
        }
      });
    }

    async sendSms(phone, code) {
      try {
        const params = {
          PhoneNumberSet: [`+86${phone}`],
          SmsSdkAppId: sms.appId,
          SignName: sms.signName,
          TemplateId: sms.templateId,
          TemplateParamSet: [code]
        };
        
        const result = await this.client.SendSms(params);
        return result.SendStatusSet[0];
      } catch (err) {
        throw new Error(`短信发送失败: ${err.message}`);
      }
    }
  };
} else {
  // 模拟短信服务
  SmsClient = class {
    async sendSms(phone, code) {
      console.log(`[模拟短信服务] 发送短信到 ${phone}，验证码: ${code}`);
      return {
        Code: 'Ok',
        Message: 'send success'
      };
    }
  };
}

module.exports = new SmsClient();