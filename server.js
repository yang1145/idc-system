const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 配置
const corsOptions = {
  origin: function (origin, callback) {
    // 允许没有 origin 的请求（比如移动应用或 Postman）
    if (!origin) return callback(null, true);
    
    // 允许所有来源 - 在生产环境中应该更严格地限制
    callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// 中间件
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// 数据库初始化
const { initDatabase } = require('./init-db');
const { createUsersTable } = require('./db/userDao');
const { createSmsTable } = require('./db/smsDao');
const { createRealnameTable } = require('./db/realnameDao');
const { createOrdersTable } = require('./db/orderDao');

// 初始化数据库表
const initializeDatabaseTables = async () => {
  try {
    await createUsersTable();
    await createSmsTable();
    await createRealnameTable();
    await createOrdersTable();
    console.log('数据库表初始化完成');
  } catch (error) {
    console.error('数据库表初始化失败:', error);
    process.exit(1);
  }
};

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/servers', require('./routes/servers'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/mcsm', require('./routes/mcsm'));

// 基础路由
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// 启动服务器
const startServer = async () => {
  try {
    // 先初始化数据库
    await initDatabase();
    
    // 再初始化表
    await initializeDatabaseTables();
    
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();