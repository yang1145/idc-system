const {
  createUsersTable,
  createDefaultUser
} = require('./userDao');

const {
  createSmsTable
} = require('./smsDao');

const {
  createOrdersTable
} = require('./orderDao');

const {
  createPaymentsTable
} = require('./paymentDao');

const {
  createCaptchaTable
} = require('./captchaDao');

const {
  createAdminsTable,
  createDefaultAdmin
} = require('./adminDao');

const {
  createMcsmInstancesTable,
  createUserInstanceBindingsTable,
  createMcsmUsersTable
} = require('./mcsmDao');

module.exports = {
  initDatabase: async () => {
    console.log('正在初始化数据库...');

    try {
      // 创建用户表
      await createUsersTable();
      console.log('用户表创建成功');

      // 创建管理员表
      await createAdminsTable();
      console.log('管理员表创建成功');

      // 创建短信验证码表
      await createSmsTable();
      console.log('短信验证码表创建成功');

      // 创建订单表
      await createOrdersTable();
      console.log('订单表创建成功');

      // 创建支付记录表
      await createPaymentsTable();
      console.log('支付记录表创建成功');

      // 创建验证码表
      await createCaptchaTable();
      console.log('验证码表创建成功');

      // 创建MCSM相关表
      await createMcsmInstancesTable();
      console.log('MCSM实例表创建成功');

      await createUserInstanceBindingsTable();
      console.log('用户实例绑定表创建成功');

      await createMcsmUsersTable();
      console.log('MCSM用户表创建成功');

      console.log('所有数据表创建完成');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  },
  createDefaultUser,
  createDefaultAdmin
};