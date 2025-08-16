const paymentDao = require('../db/paymentDao');

// 发起支付
async function createPayment(req, res) {
  const { orderId, paymentMethod, amount, description } = req.body;
  
  // 验证参数
  if (!orderId || !paymentMethod || !amount || !description) {
    return res.status(400).json({
      success: false,
      message: '缺少必要的参数'
    });
  }
  
  try {
    let paymentResult;
    
    // 根据支付方式调用不同的支付接口
    if (paymentMethod === 'wechat') {
      paymentResult = await paymentDao.createWechatPayOrder({
        orderId,
        amount,
        description
      });
    } else if (paymentMethod === 'alipay') {
      paymentResult = await paymentDao.createAlipayPayOrder({
        orderId,
        amount,
        description
      });
    } else {
      return res.status(400).json({
        success: false,
        message: '不支持的支付方式'
      });
    }
    
    if (paymentResult.code === 0) {
      res.json({
        success: true,
        data: paymentResult.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: paymentResult.message || '支付订单创建失败'
      });
    }
  } catch (error) {
    console.error('支付订单创建失败:', error);
    res.status(500).json({
      success: false,
      message: '支付订单创建失败'
    });
  }
}

// 查询支付状态
async function getPaymentStatus(req, res) {
  const { paymentId, paymentMethod } = req.params;
  const { orderId } = req.query;
  
  // 验证参数
  if (!paymentId || !paymentMethod || !orderId) {
    return res.status(400).json({
      success: false,
      message: '缺少必要的参数'
    });
  }
  
  try {
    let queryResult;
    
    // 根据支付方式调用不同的查询接口
    if (paymentMethod === 'wechat') {
      queryResult = await paymentDao.queryWechatPayOrder(orderId);
    } else if (paymentMethod === 'alipay') {
      queryResult = await paymentDao.queryAlipayPayOrder(orderId);
    } else {
      return res.status(400).json({
        success: false,
        message: '不支持的支付方式'
      });
    }
    
    if (queryResult.code === 0) {
      res.json({
        success: true,
        data: queryResult.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: queryResult.message || '支付状态查询失败'
      });
    }
  } catch (error) {
    console.error('支付状态查询失败:', error);
    res.status(500).json({
      success: false,
      message: '支付状态查询失败'
    });
  }
}

// 微信支付通知回调
function wechatNotify(req, res) {
  // 在实际应用中，这里应该处理微信支付的回调通知
  console.log('收到微信支付回调通知');
  
  // 处理支付结果通知
  // 更新订单状态等操作
  
  // 返回成功响应
  res.json({ code: 'SUCCESS', message: '成功' });
}

// 支付宝通知回调
function alipayNotify(req, res) {
  // 在实际应用中，这里应该处理支付宝的回调通知
  console.log('收到支付宝回调通知');
  
  // 处理支付结果通知
  // 更新订单状态等操作
  
  // 返回成功响应
  res.send('success');
}

module.exports = {
  createPayment,
  getPaymentStatus,
  wechatNotify,
  alipayNotify
};