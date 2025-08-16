const express = require('express');
const router = express.Router();

const {
  createPayment,
  getPaymentStatus,
  wechatNotify,
  alipayNotify
} = require('../controllers/paymentController');

// 发起支付
router.post('/api/payment/create', createPayment);

// 查询支付状态
router.get('/api/payment/status/:paymentId/:paymentMethod', getPaymentStatus);

// 微信支付通知回调
router.post('/api/payment/wechat/notify', express.raw({type: 'application/json'}), wechatNotify);

// 支付宝通知回调
router.post('/api/payment/alipay/notify', alipayNotify);

module.exports = router;