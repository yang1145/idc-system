const express = require('express');
const router = express.Router();

const {
  updateAdminPassword,
  getAllUsers,
  deleteUser
} = require('../controllers/adminController');

const authRouter = require('./auth');
const { requireAdminAuth } = authRouter;

// 更新管理员密码（管理员功能）
router.put('/api/admin/password', requireAdminAuth, updateAdminPassword);

// 获取所有用户（管理员功能）
router.get('/api/admin/users', requireAdminAuth, getAllUsers);

// 删除用户（管理员功能）
router.delete('/api/admin/users/:id', requireAdminAuth, deleteUser);

module.exports = router;