const { getConnection } = require('./config');

// 创建用户表
const createUsersTable = async () => {
  let connection;
  try {
    connection = await getConnection();
    
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
    
    await connection.query(sql);
    console.log('用户表创建成功或已存在');
  } finally {
    if (connection) connection.release();
  }
};

// 执行数据库查询的通用函数
async function queryExecutor(sql, values) {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.query(sql, values);
    return results;
  } finally {
    if (connection) connection.release();
  }
}

const userDao = {
  checkUsernameExists: async (username) => {
    const sql = 'SELECT id FROM users WHERE username = ?';
    const results = await queryExecutor(sql, [username]);
    return results.length > 0;
  },

  checkPhoneExists: async (phone) => {
    const sql = 'SELECT id FROM users WHERE phone = ?';
    const results = await queryExecutor(sql, [phone]);
    return results.length > 0;
  },

  // 根据用户名或手机号查找用户
  findUserByLogin: async (login) => {
    const sql = 'SELECT id, username, password, phone, email FROM users WHERE username = ? OR phone = ?';
    const results = await queryExecutor(sql, [login, login]);
    return results[0]; // 返回第一个匹配的用户或undefined
  },

  // 根据手机号查找用户
  findUserByPhone: async (phone) => {
    const sql = 'SELECT id, username, password, phone, email FROM users WHERE phone = ?';
    const results = await queryExecutor(sql, [phone]);
    return results[0]; // 返回第一个匹配的用户或undefined
  },

  // 创建新用户
  createUser: async (user) => {
    const { username, password, phone, email } = user;
    const sql = 'INSERT INTO users (username, password, phone, email) VALUES (?, ?, ?, ?)';
    const values = [username, password, phone, email || null];

    const results = await queryExecutor(sql, values);

    const selectSql = 'SELECT id, username, password, phone, email FROM users WHERE id = ?';
    const selectResults = await queryExecutor(selectSql, [results.insertId]);
    return selectResults[0];
  }
};

module.exports = userDao;
module.exports.createUsersTable = createUsersTable;