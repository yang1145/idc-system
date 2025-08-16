const { getConnection } = require('./config');

// 创建短信验证码表
const createSmsTable = async () => {
  let connection;
  try {
    connection = await getConnection();
    
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
    
    await connection.query(sql);
    console.log('短信验证码表创建成功或已存在');
  } finally {
    if (connection) connection.release();
  }
};

// 短信验证码数据访问对象
const smsDao = {
  // 保存验证码
  saveSmsCode: async (phone, code, expiresAt) => {
    let connection;
    try {
      connection = await getConnection();
      
      // 先删除过期的验证码
      await connection.query('DELETE FROM sms_codes WHERE expires_at < NOW()');
      
      const sql = 'INSERT INTO sms_codes (phone, code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE code = ?, expires_at = ?';
      const values = [phone, code, expiresAt, code, expiresAt];
      
      const [results] = await connection.query(sql, values);
      return results;
    } finally {
      if (connection) connection.release();
    }
  },
  
  // 验证验证码
  verifySmsCode: async (phone, code) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'SELECT id FROM sms_codes WHERE phone = ? AND code = ? AND expires_at > NOW()';
      const values = [phone, code];
      
      const [results] = await connection.query(sql, values);
      return results.length > 0;
    } finally {
      if (connection) connection.release();
    }
  },
  
  // 删除验证码
  deleteSmsCode: async (phone, code) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'DELETE FROM sms_codes WHERE phone = ? AND code = ?';
      const values = [phone, code];
      
      const [results] = await connection.query(sql, values);
      return results;
    } finally {
      if (connection) connection.release();
    }
  },
  
  // 清理过期验证码
  cleanExpiredCodes: async () => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'DELETE FROM sms_codes WHERE expires_at < NOW()';
      
      const [results] = await connection.query(sql);
      return results;
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = smsDao;
module.exports.createSmsTable = createSmsTable;