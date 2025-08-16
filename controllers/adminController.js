const bcrypt = require('bcryptjs');
const adminDao = require('../db/adminDao');

// 更新管理员密码（管理员功能）
async function updateAdminPassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const adminId = req.admin.id;
  
  // 验证参数
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: '当前密码和新密码是必填项'
    });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: '新密码长度至少6位'
    });
  }
  
  try {
    // 查找管理员
    const admin = await adminDao.findAdminByUsername(req.admin.username);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '管理员不存在'
      });
    }
    
    // 验证当前密码
    const result = await bcrypt.compare(currentPassword, admin.password);
    if (!result) {
      return res.status(401).json({
        success: false,
        message: '当前密码错误'
      });
    }
    
    // 更新密码
    const updated = await adminDao.updateAdminPassword(adminId, newPassword);
    
    if (updated) {
      res.json({
        success: true,
        message: '密码更新成功'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '密码更新失败'
      });
    }
  } catch (error) {
    console.error('更新管理员密码错误:', error);
    res.status(500).json({
      success: false,
      message: '密码更新失败'
    });
  }
}

// 获取所有用户（管理员功能）
async function getAllUsers(req, res) {
  try {
    const users = await adminDao.getAllUsers();
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
}

// 删除用户（管理员功能）
async function deleteUser(req, res) {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      message: '无效的用户ID'
    });
  }
  
  try {
    const result = await adminDao.deleteUser(userId);
    
    if (result) {
      res.json({
        success: true,
        message: '用户删除成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '用户未找到'
      });
    }
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败'
    });
  }
}

module.exports = {
  updateAdminPassword,
  getAllUsers,
  deleteUser
};