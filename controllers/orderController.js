const orderDao = require('../db/orderDao');

// 价格参数 (与服务器配置保持一致)
const priceParams = {
  cpu: 10,
  memory: 5,
  disk: 0.1,
  bandwidth: 0.5,
  port: 2
};

// 创建订单
async function createOrder(req, res) {
  const { serverId, cpu, memory, disk, bandwidth, ports, months, customerInfo } = req.body;
  const userId = req.user.id; // 从认证信息中获取用户ID
  
  // 验证参数
  if (!serverId || !cpu || !memory || !disk || !bandwidth || !ports || !months || !customerInfo) {
    return res.status(400).json({
      success: false,
      message: '缺少必要的参数'
    });
  }
  
  try {
    // 生成订单ID
    const orderId = 'ORD' + Date.now();
    
    // 计算价格
    const cpuCost = cpu * priceParams.cpu;
    const memoryCost = memory * priceParams.memory;
    const diskCost = disk * priceParams.disk;
    const bandwidthCost = bandwidth * priceParams.bandwidth;
    const portCost = ports * priceParams.port;
    
    const monthlyCost = cpuCost + memoryCost + diskCost + bandwidthCost + portCost;
    const totalCost = monthlyCost * months;
    
    // 保存订单到数据库
    const orderData = {
      orderId,
      userId,
      serverId,
      cpu,
      memory,
      disk,
      bandwidth,
      ports,
      months,
      monthlyCost: parseFloat(monthlyCost.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      customerInfo
    };
    
    const createdOrder = await orderDao.createOrder(orderData);
    
    res.json({
      success: true,
      data: {
        orderId: orderId,
        serverId: serverId,
        configuration: {
          cpu,
          memory,
          disk,
          bandwidth,
          ports
        },
        months: months,
        customerInfo: customerInfo,
        pricing: {
          monthlyCost: parseFloat(monthlyCost.toFixed(2)),
          totalCost: parseFloat(totalCost.toFixed(2))
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({
      success: false,
      message: '创建订单失败'
    });
  }
}

// 获取订单详情
async function getOrderById(req, res) {
  const { orderId } = req.params;
  const userId = req.user.id;
  
  // 验证参数
  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: '订单ID是必填项'
    });
  }
  
  try {
    // 获取订单详情
    const order = await orderDao.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单未找到'
      });
    }
    
    // 验证订单是否属于当前用户
    if (order.user_id != userId) {
      return res.status(403).json({
        success: false,
        message: '无权访问此订单'
      });
    }
    
    res.json({
      success: true,
      data: {
        orderId: order.order_id,
        serverId: order.server_id,
        configuration: {
          cpu: order.cpu,
          memory: order.memory,
          disk: order.disk,
          bandwidth: order.bandwidth,
          ports: order.ports
        },
        months: order.months,
        pricing: {
          monthlyCost: order.monthly_cost,
          totalCost: order.total_cost
        },
        status: order.status,
        createdAt: order.created_at
      }
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单详情失败'
    });
  }
}

// 获取用户订单列表
async function getOrdersByUserId(req, res) {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: '缺少用户ID参数'
    });
  }
  
  try {
    const orders = await orderDao.getOrdersByUserId(userId);
    
    // 格式化订单数据
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderId: order.order_id,
      serverId: order.server_id,
      configuration: {
        cpu: order.cpu,
        memory: order.memory,
        disk: order.disk,
        bandwidth: order.bandwidth,
        ports: order.ports
      },
      months: order.months,
      pricing: {
        monthlyCost: order.monthly_cost,
        totalCost: order.total_cost
      },
      customerInfo: {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email
      },
      status: order.status,
      createdAt: order.created_at
    }));
    
    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('获取用户订单错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单失败'
    });
  }
}

// 获取所有订单（管理员功能）
async function getAllOrders(req, res) {
  try {
    const orders = await orderDao.getAllOrders();
    
    // 格式化订单数据
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderId: order.order_id,
      userId: order.user_id,
      userUsername: order.user_username,
      serverId: order.server_id,
      configuration: {
        cpu: order.cpu,
        memory: order.memory,
        disk: order.disk,
        bandwidth: order.bandwidth,
        ports: order.ports
      },
      months: order.months,
      pricing: {
        monthlyCost: order.monthly_cost,
        totalCost: order.total_cost
      },
      customerInfo: {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email
      },
      status: order.status,
      createdAt: order.created_at
    }));
    
    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败'
    });
  }
}

// 更新订单状态（管理员功能）
async function updateOrderStatus(req, res) {
  const { orderId } = req.params;
  const { status } = req.body;
  
  // 验证状态值
  const validStatuses = ['pending', 'paid', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: '无效的订单状态'
    });
  }
  
  try {
    const result = await orderDao.updateOrderStatus(orderId, status);
    
    if (result) {
      res.json({
        success: true,
        message: '订单状态更新成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '订单未找到'
      });
    }
  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新订单状态失败'
    });
  }
}

module.exports = {
  createOrder,
  getOrderById,
  getOrdersByUserId,
  getAllOrders,
  updateOrderStatus
};