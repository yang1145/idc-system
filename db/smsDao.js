const { getConnection } = require('./config');

// 短信验证码数据访问对象
const smsDao = {
  // 保存验证码
  saveSmsCode: async (phone, code, expiresAt) => {
    let connection;
    try {
      connection = await getConnection();
      
      // 先删除过期的验证码
      await connection.promise().query('DELETE FROM sms_codes WHERE expires_at < NOW()');
      
      const sql = 'INSERT INTO sms_codes (phone, code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE code = ?, expires_at = ?';
      const values = [phone, code, expiresAt, code, expiresAt];
      
      const [results] = await connection.promise().query(sql, values);
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
      
      const [results] = await connection.promise().query(sql, values);
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
      
      const [results] = await connection.promise().query(sql, values);
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
      
      const [results] = await connection.promise().query(sql);
      return results;
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = smsDao;