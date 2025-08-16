const express = require('express');
const cors = require('cors');
require('dotenv').config();

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
const { initDatabase } = require('./db/init');
initDatabase().catch(error => {
  console.error('数据库初始化失败:', error);
  process.exit(1);
});

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
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});