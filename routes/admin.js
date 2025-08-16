const express = require('express');
const router = express.Router();

const {
  updateAdminPassword,
  getAllUsers,
  deleteUser,
  getAllOrders
} = require('../controllers/adminController');

const authRouter = require('./auth');
const { requireAdminAuth } = authRouter;

// 更新管理员密码（管理员功能）
router.put('/password', requireAdminAuth, updateAdminPassword);

// 获取所有用户（管理员功能）
router.get('/users', requireAdminAuth, getAllUsers);

// 删除用户（管理员功能）
router.delete('/users/:id', requireAdminAuth, deleteUser);

// 获取所有订单（管理员功能）
router.get('/orders', requireAdminAuth, getAllOrders);

module.exports = router;