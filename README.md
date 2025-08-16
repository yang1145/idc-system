# 云服务器售卖系统

一个基于 Node.js 和 Express 的云服务器售卖系统后端服务，提供服务器配置、价格计算、订单管理、MCSM面板集成等功能。

## 功能特性

- 提供服务器配置信息 API
- 实时计算服务器价格
- 订单创建和管理
- 用户注册和登录功能
- 密码加密存储
- 手机短信验证码登录/注册
- MySQL数据库存储用户数据
- RESTful API 设计
- 微信支付和支付宝集成
- 管理员后台管理功能
- 管理员登录图像验证码验证
- MCSM面板集成（用于创建和管理实际的云服务器实例）

## 管理员功能

系统提供管理员后台管理功能，包括：

1. 用户管理：
   - 查看所有注册用户
   - 删除用户

2. 订单管理：
   - 查看所有订单
   - 管理订单状态（待支付、已支付、已取消、已完成）

3. 安全功能：
   - 图像验证码验证登录
   - 管理员密码修改

### 管理员登录

管理员可以通过访问 `/admin/index.html` 进入管理登录页面。登录时需要输入用户名、密码和图像验证码。

### 管理员面板

登录成功后将跳转到 `/admin/dashboard.html`，在此可以管理用户、订单和服务器实例。

## 技术栈

- 后端: Node.js + Express.js
- 数据库: MySQL 8.0
- 其他技术:
  - cors: 跨域资源共享
  - dotenv: 环境变量管理
  - bcryptjs: 密码加密
  - @tencentcloud/sms-sdk: 腾讯云短信服务
  - mysql2: MySQL 数据库驱动
  - wechatpay-node-v3: 微信支付 SDK
  - alipay-sdk: 支付宝 SDK
  - axios: HTTP客户端（用于MCSM API调用）

## 安装和运行

1. 克隆项目:
   ```
   git clone https://github.com/yang1145/idc-system.git
   ```

2. 安装依赖:
   ```
   npm install
   ```

3. 配置环境变量:
   复制 [.env.example]文件并重命名为 .env，然后根据需要修改配置

4. 初始化数据库:
   ```
   node init-db.js
   ```

5. 启动服务:
   ```
   npm start
   ```
   
   或开发模式:
   ```
   npm run dev
   ```

## 打包和部署

### 打包项目

要创建项目发行包，可以使用以下命令：

```
npm run pack
```

这将创建一个 `.tgz` 文件，可以用于分发或部署。

### 构建生产环境

要为生产环境构建项目，运行：

```
npm run build
```

这将安装生产依赖并优化项目以供部署。

### 部署说明

1. 确保目标服务器已安装 Node.js (版本 >= 14.0.0) 和 npm
2. 将项目文件复制到服务器
3. 安装生产依赖：
   ```
   npm install --production
   ```
4. 配置环境变量（参考 [.env]文件）
5. 启动服务：
   ```
   npm start
   ```
   
或者使用进程管理器（如 PM2）来管理应用：
```
npm install -g pm2
pm2 start server.js --name "cloud-server"
```

## 部署

### Docker 部署:
```
docker build -t cloud-server .
docker run -d -p 3000:3000 --name cloud-server-app cloud-server
```

## MCSM集成

本系统集成了MCSM（Minecraft Server Manager）面板，可以自动创建和管理服务器实例。当用户支付订单后，系统会自动在MCSM面板中创建对应的服务器实例。

### MCSM功能包括：

1. 自动创建服务器实例
2. 管理服务器状态（启动、停止、重启）
3. 获取服务器详细信息
4. 删除服务器实例

## 数据库设计

### 用户表 (users)
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 短信验证码表 (sms_codes)
```sql
CREATE TABLE sms_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_expires (expires_at)
);
```

## API 端点

### 用户认证

- `POST /api/auth/send-sms` - 发送短信验证码（用于注册或登录）
- `POST /api/auth/register` - 用户注册（需要短信验证码验证，支持手机号注册）
- `POST /api/auth/login` - 用户名/手机号 + 密码登录
- `POST /api/auth/login-sms` - 手机号 + 短信验证码登录
- `GET /api/auth/captcha` - 生成图像验证码
- `POST /api/auth/verify-captcha` - 验证图像验证码（用于测试）
- `POST /api/auth/admin/login` - 管理员登录

### 获取服务器配置

- `GET /api/servers` - 获取所有服务器配置列表
- `GET /api/servers/:id` - 获取特定ID的服务器配置详情
- `POST /api/servers/calculate` - 实时计算自定义服务器配置价格

请求体示例：
```json
{
  "cpu": 4,          // CPU核心数
  "memory": 16,      // 内存大小（GB）
  "disk": 500,       // 硬盘容量（GB）
  "bandwidth": 100,  // 带宽（Mbps）
  "ports": 5,        // 公网IP数量
  "months": 12       // 购买时长（月）
}
```

## 可选配置参数

API 支持以下可选参数来进一步定制服务器配置：

- `os`: 操作系统类型（如 "Linux", "Windows"）
- `datacenter`: 数据中心位置（如 "北京", "上海", "广州"）
- `backup`: 是否启用自动备份（布尔值）
- `ssl`: 是否需要SSL证书（布尔值）
- `firewall`: 是否启用防火墙（布尔值）
- `dedicated_ip`: 是否需要独立公网IP（布尔值）

这些可选参数可以根据具体业务需求添加到请求体中。

### 订单管理

- `POST /api/orders` - 创建新订单并生成支付请求（需要用户认证）
- `GET /api/orders/:orderId` - 获取订单详情（需要用户认证）
- `GET /api/orders` - 获取用户订单列表（需要用户认证）
- `GET /api/orders/admin/orders` - 获取所有订单（管理员功能，需要管理员认证）
- `PUT /api/orders/admin/orders/:orderId/status` - 更新订单状态（管理员功能，需要管理员认证）

请求体示例：
```json
{
  "serverId": 1,     // 服务器配置ID（可选）
  "cpu": 4,          // 自定义配置参数（可选）
  "memory": 16,
  "disk": 500,
  "bandwidth": 100,
  "ports": 5,
  "months": 12,
  "customerInfo": {  // 客户信息
    "name": "张三",
    "email": "zhangsan@example.com",
    "phone": "13800138000"
  }
}
```

### 支付管理

- `POST /api/payment/create` - 发起支付
- `GET /api/payment/status/:paymentId/:paymentMethod` - 查询支付状态
- `POST /api/payment/wechat/notify` - 微信支付通知回调
- `POST /api/payment/alipay/notify` - 支付宝通知回调

### 管理员功能

- `PUT /api/admin/password` - 更新管理员密码（需要管理员认证）
- `GET /api/admin/users` - 获取所有用户（需要管理员认证）
- `DELETE /api/admin/users/:id` - 删除用户（需要管理员认证）
- `GET /api/admin/orders` - 获取所有订单（需要管理员认证）

### MCSM 面板集成

#### 管理员操作

- `POST /api/mcsm/instances/:instanceId/start` - 启动MCSM实例（需要管理员认证）
- `POST /api/mcsm/instances/:instanceId/stop` - 停止MCSM实例（需要管理员认证）
- `POST /api/mcsm/instances/:instanceId/restart` - 重启MCSM实例（需要管理员认证）
- `POST /api/mcsm/instances/:instanceId/command` - 发送命令到MCSM实例（需要管理员认证）
- `GET /api/mcsm/instances/:instanceId/log` - 获取MCSM实例控制台日志（需要管理员认证）
- `PUT /api/mcsm/instances/:instanceId/port` - 更改MCSM实例端口（需要管理员认证）
- `GET /api/mcsm/users` - 获取所有MCSM用户（需要管理员认证）
- `POST /api/mcsm/users` - 创建MCSM用户（需要管理员认证）
- `DELETE /api/mcsm/users/:userId` - 删除MCSM用户（需要管理员认证）
- `POST /api/mcsm/users/:userId/instances/:instanceId/bind` - 绑定用户到实例（需要管理员认证）
- `DELETE /api/mcsm/users/:userId/instances/:instanceId/bind` - 解绑用户从实例（需要管理员认证）
- `GET /api/mcsm/users/:userId/instances` - 获取用户绑定的实例列表（需要管理员认证）
- `GET /api/mcsm/instances/:instanceId/users` - 获取实例绑定的用户列表（需要管理员认证）

#### 用户操作

- `GET /api/mcsm/user/instances` - 用户获取自己的实例列表（需要用户认证）
- `POST /api/mcsm/user/instances/:instanceId/command` - 用户发送命令到自己的实例（需要用户认证）
- `GET /api/mcsm/user/instances/:instanceId/log` - 用户获取自己实例的控制台日志（需要用户认证）

## 前端页面

- `/` - 主页（产品概览）
- `/login` - 用户登录/注册页面（包含两个功能模块：用户名/密码登录与短信验证码登录/注册）
- `/buy.html` - 服务器配置和购买页面（可自定义配置并实时计算价格）
- `/payment.html` - 支付页面
- `/admin` - 管理员登录页面
- `/admin/dashboard.html` - 管理员仪表板页面

## 项目结构

```
.
├── config/                 # 配置文件
│   ├── app.js             # 应用配置
│   └── database.js        # 数据库配置
├── controllers/            # 控制器层
│   ├── adminController.js # 管理员控制器
│   ├── authController.js  # 认证控制器
│   ├── mcsmController.js  # MCSM面板控制器
│   ├── orderController.js # 订单控制器
│   ├── paymentController.js # 支付控制器
│   └── serverController.js # 服务器配置控制器
├── db/                     # 数据库访问层
│   ├── adminDao.js        # 管理员数据访问对象
│   ├── captchaDao.js      # 验证码数据访问对象
│   ├── config.js          # 数据库配置
│   ├── init.js            # 数据库初始化
│   ├── mcsmDao.js         # MCSM数据访问对象
│   ├── orderDao.js        # 订单数据访问对象
│   ├── paymentDao.js      # 支付数据访问对象
│   ├── smsDao.js          # 短信数据访问对象
│   ├── test.js            # 测试文件
│   └── userDao.js         # 用户数据访问对象
├── middleware/             # 中间件
│   └── auth.js            # 认证中间件
├── public/                 # 静态文件
│   ├── admin/             # 管理员页面
│   │   ├── dashboard.html # 管理员仪表板页面
│   │   ├── index.html     # 管理员登录页面
│   │   └── mcsm.html      # MCSM管理页面
│   ├── buy.html           # 购买服务器页面
│   ├── img/               # 图片资源
│   ├── index.html         # 主页
│   ├── login/             # 登录注册页面
│   │   ├── app.js         # 登录页面JavaScript
│   │   ├── index.html     # 登录注册主页面
│   │   └── style.css      # 登录页面样式
│   ├── payment.html       # 支付页面
│   ├── success.html       # 支付成功页面
│   ├── test.html          # 测试页面
├── routes/                 # 路由定义
│   ├── admin.js           # 管理员路由
│   ├── auth.js            # 认证路由
│   ├── mcsm.js            # MCSM路由
│   ├── orders.js          # 订单路由
│   ├── payment.js         # 支付路由
│   └── servers.js         # 服务器配置路由
├── services/               # 业务服务层
│   ├── paymentService.js  # 支付服务
│   └── smsService.js      # 短信服务
├── utils/                  # 工具函数
│   ├── helpers.js         # 通用工具函数
│   └── logger.js          # 日志服务
├── .env.example           # 环境变量示例
├── init-db.js             # 数据库初始化脚本
├── mcsmAPI.js             # MCSM API 集成
├── mcsmClient.js          # MCSM 客户端
├── package.json           # 项目依赖配置
└── server.js              # 应用入口文件
```

该脚本会创建以下默认管理员账户：
- 用户名: admin
- 密码: 123456
- 邮箱: admin@example.com

**安全提醒**: 出于安全考虑，强烈建议在首次登录后立即修改默认密码。

## 安全性

- 密码使用 bcryptjs 加密存储
- 短信验证码验证
- 输入验证（用户名、密码、手机号、邮箱）
- API 访问控制

## 开发说明

1. 所有 API 端点都以 `/api` 开头
2. 成功的响应格式：
   ```json
   {
     "success": true,
     "data": {}
   }
   ```

3. 错误响应格式：
   ```json
   {
     "success": false,
     "message": "错误信息"
   }
   ```

## 用户认证功能说明

### 注册功能
- 用户名长度应为3-20个字符
- 密码长度应为6-20个字符
- 必须提供有效的中国大陆手机号
- 必须提供有效的短信验证码
- 手机号必须唯一，不能重复注册

### 登录功能
- 支持两种登录方式：
  1. 用户名/手机号 + 密码登录
  2. 手机号 + 短信验证码登录

### 短信验证码功能
- 用户注册时需要短信验证码验证
- 用户可以通过短信验证码直接登录
- 验证码60秒内不能重复发送

## 腾讯云短信集成说明

当前版本使用模拟短信发送功能，在实际部署时需要：

1. 在 `.env` 文件中配置腾讯云短信参数：
   ```
   TENCENT_SECRET_ID=your_secret_id
   TENCENT_SECRET_KEY=your_secret_key
   TENCENT_SMS_SDK_APP_ID=your_sdk_app_id
   TENCENT_SMS_SIGN_NAME=your_sign_name
   TENCENT_SMS_TEMPLATE_ID=your_template_id
   ```

2. 取消注释 [server.js]中的腾讯云短信集成代码并注释模拟发送函数

## 数据库配置说明

1. 确保本地已安装并运行MySQL服务
2. 创建数据库：
   ```sql
   CREATE DATABASE cloud_server;
   ```
3. 在 [.env]文件中配置数据库连接参数：
   ```
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=cloud_server
   ```
4. 应用启动时会自动创建所需的表结构

## 支付功能说明

系统已集成微信支付和支付宝功能：

### 微信支付
- 需要在 `.env` 文件中配置微信支付相关参数
- 支持创建支付订单和查询支付状态

### 支付宝
- 需要在 `.env` 文件中配置支付宝相关参数
- 支持创建支付订单和查询支付状态

### 支付回调
- 系统提供微信支付和支付宝的回调接口
- 支付完成后会自动更新订单状态

## MCSM面板配置说明

系统支持与MCSM面板集成，用于自动创建和管理服务器实例：

1. 在 `.env` 文件中配置MCSM相关参数：
   ```
   MCSM_API_KEY=your_api_key
   MCSM_BASE_URL=http://your-mcsm-panel.com
   ```

2. 系统会在用户支付成功后自动创建对应的服务器实例

## 可选功能配置说明

本系统支持在缺少第三方服务配置的情况下正常启动，部分功能将受限：

### 短信服务
- **可选配置**：腾讯云短信服务参数
- **默认行为**：未配置时使用模拟发送，仅在控制台输出验证码
- **生产环境**：建议配置真实的腾讯云短信服务参数以启用真实短信发送功能

### 支付功能
- **可选配置**：微信支付和支付宝参数
- **默认行为**：未配置时支付功能仍然可用，但会返回配置缺失提示
- **生产环境**：必须配置真实的支付参数以启用完整支付功能

### MCSM集成
- **可选配置**：MCSM面板API密钥和地址
- **默认行为**：未配置时会在订单支付成功后记录日志但不创建实际服务器实例
- **生产环境**：配置后可自动创建和管理服务器实例

### 配置检查
系统在启动时会检查配置完整性，并在日志中输出相关提示信息，便于部署时确认配置状态。

## 已知问题

- 当前版本使用模拟短信发送功能，需集成真实腾讯云短信服务
- 未实现 JWT 令牌认证
- 缺乏频率限制等安全防护措施