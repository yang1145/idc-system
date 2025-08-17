const { getConnection } = require('./config');

// 创建实名认证表
const createRealnameTable = async () => {
  let connection;
  try {
    connection = await getConnection();
    
    const sql = `
      CREATE TABLE IF NOT EXISTS realname_auth (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        name VARCHAR(50) NOT NULL,
        id_card VARCHAR(18) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
      )
    `;
    
    await connection.query(sql);
    console.log('实名认证表创建成功或已存在');
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

const realnameDao = {
  // 创建实名认证记录
  createRealnameAuth: async (userId, name, idCard) => {
    const sql = 'INSERT INTO realname_auth (user_id, name, id_card) VALUES (?, ?, ?)';
    const values = [userId, name, idCard];
    
    const results = await queryExecutor(sql, values);
    
    const selectSql = 'SELECT id, user_id, name, id_card, status, created_at, updated_at FROM realname_auth WHERE id = ?';
    const selectResults = await queryExecutor(selectSql, [results.insertId]);
    return selectResults[0];
  },

  // 根据用户ID查找实名认证记录
  findByUserId: async (userId) => {
    const sql = 'SELECT id, user_id, name, id_card, status, created_at, updated_at FROM realname_auth WHERE user_id = ?';
    const results = await queryExecutor(sql, [userId]);
    return results[0]; // 返回第一个匹配的记录或undefined
  },

  // 更新实名认证状态
  updateStatus: async (userId, status) => {
    const sql = 'UPDATE realname_auth SET status = ? WHERE user_id = ?';
    const results = await queryExecutor(sql, [status, userId]);
    return results.affectedRows > 0;
  }
};

module.exports = realnameDao;
module.exports.createRealnameTable = createRealnameTable;