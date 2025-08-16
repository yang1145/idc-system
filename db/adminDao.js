const { getConnection } = require('./config');
const bcrypt = require('bcryptjs');

// 默认管理员账户信息
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123', // 建议上线后修改此默认密码
  email: 'admin@example.com'
};

// 创建管理员表
const createAdminsTable = async () => {
  let connection;
  try {
    connection = await getConnection();
    
    const sql = `
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username)
      )
    `;
    
    await connection.query(sql);
    console.log('管理员表创建成功或已存在');
  } finally {
    if (connection) connection.release();
  }
};

// 根据用户名查找管理员
const findAdminByUsername = async (username) => {
  let connection;
  try {
    connection = await getConnection();
    
    const sql = 'SELECT * FROM admins WHERE username = ?';
    const values = [username];
    
    const [results] = await connection.query(sql, values);
    return results[0]; // 返回第一个匹配的管理员或undefined
  } finally {
    if (connection) connection.release();
  }
};

// 创建新管理员
const createAdmin = async (adminData) => {
  let connection;
  try {
    connection = await getConnection();
    
    // 对密码进行加密
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
    
    const { username, email } = adminData;
    const sql = 'INSERT INTO admins (username, password, email) VALUES (?, ?, ?)';
    const values = [username, hashedPassword, email];
    
    const [results] = await connection.query(sql, values);
    return {
      id: results.insertId,
      username,
      email
    };
  } finally {
    if (connection) connection.release();
  }
};

// 创建默认管理员账户
const createDefaultAdmin = async () => {
  try {
    // 检查是否已存在管理员账户
    const existingAdmin = await findAdminByUsername(DEFAULT_ADMIN.username);
    
    if (existingAdmin) {
      console.log('默认管理员账户已存在:');
      console.log('- 用户名:', existingAdmin.username);
      console.log('- 邮箱:', existingAdmin.email);
      console.log('注意: 出于安全考虑，建议登录后立即修改默认密码');
    } else {
      // 创建默认管理员账户
      const adminData = {
        username: DEFAULT_ADMIN.username,
        password: DEFAULT_ADMIN.password,
        email: DEFAULT_ADMIN.email
      };
      
      const newAdmin = await createAdmin(adminData);
      console.log('默认管理员账户创建成功:');
      console.log('- 用户名:', newAdmin.username);
      console.log('- 密码:', DEFAULT_ADMIN.password);
      console.log('- 邮箱:', newAdmin.email);
      console.log('注意: 出于安全考虑，建议登录后立即修改默认密码');
    }
  } catch (error) {
    console.error('创建默认管理员账户时出错:', error);
    throw error;
  }
};

// 更新管理员密码
const updateAdminPassword = async (adminId, newPassword) => {
  let connection;
  try {
    connection = await getConnection();
    
    // 对新密码进行加密
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    const sql = 'UPDATE admins SET password = ? WHERE id = ?';
    const values = [hashedPassword, adminId];
    
    const [results] = await connection.query(sql, values);
    return results.affectedRows > 0;
  } finally {
    if (connection) connection.release();
  }
};

// 获取所有用户
const getAllUsers = async () => {
  let connection;
  try {
    connection = await getConnection();
    
    const sql = 'SELECT id, username, phone, email, created_at FROM users ORDER BY created_at DESC';
    
    const [results] = await connection.query(sql);
    return results;
  } finally {
    if (connection) connection.release();
  }
};

// 删除用户
const deleteUser = async (userId) => {
  let connection;
  try {
    connection = await getConnection();
    
    const sql = 'DELETE FROM users WHERE id = ?';
    const values = [userId];
    
    const [results] = await connection.query(sql, values);
    return results.affectedRows > 0;
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  createAdminsTable,
  findAdminByUsername,
  createAdmin,
  createDefaultAdmin,
  updateAdminPassword,
  getAllUsers,
  deleteUser
};