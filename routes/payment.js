const express = require('express');
const router = express.Router();

const {
  createPayment,
  getPaymentStatus,
  wechatNotify,
  alipayNotify
} = require('../controllers/paymentController');

// 发起支付
router.post('/create', createPayment);

// 查询支付状态
router.get('/status/:paymentId/:paymentMethod', getPaymentStatus);

// 微信支付通知回调
router.post('/wechat/notify', express.raw({type: 'application/json'}), wechatNotify);

// 支付宝通知回调
router.post('/alipay/notify', alipayNotify);

module.exports = router;