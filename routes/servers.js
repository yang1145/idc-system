const express = require('express');
const router = express.Router();

const {
  getAllServers,
  getServerById,
  calculatePrice
} = require('../controllers/serverController');

// 获取所有服务器配置
router.get('/api/servers', getAllServers);

// 根据ID获取特定服务器配置
router.get('/api/servers/:id', getServerById);

// 计算服务器价格
router.post('/api/calculate', calculatePrice);

module.exports = router;