const express = require('express');
const router = express.Router();

const {
  createOrder,
  getOrderById,
  getOrdersByUserId,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');

const authRouter = require('./auth');
const { requireUserAuth, requireAdminAuth } = authRouter;

// 创建订单
router.post('/', requireUserAuth, createOrder);

// 获取订单详情
router.get('/:orderId', requireUserAuth, getOrderById);

// 获取用户订单列表
router.get('/', requireUserAuth, getOrdersByUserId);

// 获取所有订单（管理员功能）
router.get('/admin/orders', requireAdminAuth, getAllOrders);

// 更新订单状态（管理员功能）
router.put('/admin/orders/:orderId/status', requireAdminAuth, updateOrderStatus);

module.exports = router;