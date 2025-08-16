#!/usr/bin/env node
/**
 * 数据库初始化脚本
 * 提供向后兼容性，可以直接运行此脚本来初始化数据库
 */

const mysql = require('mysql2');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 创建不指定数据库的连接
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
});

// 创建数据库
const createDatabase = () => {
  return new Promise((resolve, reject) => {
    const dbName = process.env.DB_NAME || 'cloud_server';
    connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err, results) => {
      if (err) {
        reject(err);
      } else {
        console.log(`数据库 ${dbName} 创建成功或已存在`);
        resolve(results);
      }
    });
  });
};

// 创建用户表
const createUsersTable = () => {
  const dbName = process.env.DB_NAME || 'cloud_server';
  
  // 切换到指定数据库
  connection.changeUser({ database: dbName }, (err) => {
    if (err) {
      console.error('切换数据库失败:', err);
      return;
    }

    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL UNIQUE,
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_phone (phone)
      )
    `;

    connection.query(sql, (err, results) => {
      if (err) {
        console.error('创建用户表失败:', err);
      } else {
        console.log('用户表创建成功或已存在');
      }
    });
  });
};

// 创建短信验证码表
const createSmsCodesTable = () => {
  const dbName = process.env.DB_NAME || 'cloud_server';
  
  // 确保在正确的数据库中
  connection.changeUser({ database: dbName }, (err) => {
    if (err) {
      console.error('切换数据库失败:', err);
      return;
    }

    const sql = `
      CREATE TABLE IF NOT EXISTS sms_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_phone (phone),
        INDEX idx_expires (expires_at)
      )
    `;

    connection.query(sql, (err, results) => {
      if (err) {
        console.error('创建短信验证码表失败:', err);
      } else {
        console.log('短信验证码表创建成功或已存在');
      }
    });
  });
};

// 关闭连接
const closeConnection = () => {
  connection.end();
};

// 主函数
const initDatabase = async () => {
  try {
    console.log('开始初始化数据库...');
    await createDatabase();
    
    // 创建表
    createUsersTable();
    createSmsCodesTable();
    
    console.log('数据库初始化完成');
    closeConnection();
  } catch (error) {
    console.error('数据库初始化失败:', error);
    closeConnection();
    process.exit(1);
  }
};

// 如果直接运行此脚本，则执行初始化
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('数据库初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('数据库初始化失败:', error);
      process.exit(1);
    });
}

module.exports = {
  initDatabase
};