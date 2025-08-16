const mysql = require('mysql2');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

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

// 创建不指定数据库的连接
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
});

// 创建数据库
const createDatabase = () => {
  return new Promise((resolve, reject) => {
    connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'idc'}`, (err, results) => {
      if (err) {
        reject(err);
      } else {
        console.log(`数据库 ${process.env.DB_NAME || 'idc'} 创建成功或已存在`);
        resolve(results);
      }
    });
  });
};

// 关闭连接
const closeConnection = () => {
  connection.end();
};

module.exports = {
  initDatabase: async () => {
    console.log('正在初始化数据库...');

    try {
      // 创建数据库
      await createDatabase();
      
      // 切换到指定数据库
      connection.changeUser({ database: process.env.DB_NAME || 'idc' }, (err) => {
        if (err) {
          console.error('切换数据库失败:', err);
          throw err;
        }
      });

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

      // 创建默认管理员账户
      await createDefaultAdmin();
      console.log('默认管理员账户检查/创建完成');

      console.log('所有数据表创建完成');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      closeConnection();
      throw error;
    }
    
    closeConnection();
  },
  createDefaultUser,
  createDefaultAdmin
};