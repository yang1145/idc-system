const mysql = require('mysql2');

// 从环境变量获取配置信息
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'idc',
  port: process.env.DB_PORT || 3306
};

// 创建连接池
const pool = mysql.createPool(config);

// 定义获取连接的函数
const getConnection = async () => {
  return await pool.promise().getConnection();
};

// 导出连接池和获取连接的函数
module.exports = {
  pool,
  getConnection
};