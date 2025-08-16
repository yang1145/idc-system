const express = require('express');
const router = express.Router();

const {
  startInstance,
  stopInstance,
  restartInstance,
  sendCommand,
  getInstanceLog,
  changeInstancePort,
  getAllUsers,
  createUser,
  deleteUser,
  bindUserToInstance,
  unbindUserFromInstance,
  getUserInstances,
  getInstanceUsers,
  getOwnInstances,
  sendCommandToOwnInstance,
  getOwnInstanceLog
} = require('../controllers/mcsmController');

const authRouter = require('./auth');
const { requireUserAuth, requireAdminAuth } = authRouter;

// 启动MCSM实例
router.post('/api/mcsm/instances/:instanceId/start', requireAdminAuth, startInstance);

// 停止MCSM实例
router.post('/api/mcsm/instances/:instanceId/stop', requireAdminAuth, stopInstance);

// 重启MCSM实例
router.post('/api/mcsm/instances/:instanceId/restart', requireAdminAuth, restartInstance);

// 发送命令到MCSM实例
router.post('/api/mcsm/instances/:instanceId/command', requireAdminAuth, sendCommand);

// 获取MCSM实例控制台日志
router.get('/api/mcsm/instances/:instanceId/log', requireAdminAuth, getInstanceLog);

// 更改MCSM实例端口
router.put('/api/mcsm/instances/:instanceId/port', requireAdminAuth, changeInstancePort);

// 获取所有MCSM用户
router.get('/api/mcsm/users', requireAdminAuth, getAllUsers);

// 创建MCSM用户
router.post('/api/mcsm/users', requireAdminAuth, createUser);

// 删除MCSM用户
router.delete('/api/mcsm/users/:userId', requireAdminAuth, deleteUser);

// 绑定用户到实例
router.post('/api/mcsm/users/:userId/instances/:instanceId/bind', requireAdminAuth, bindUserToInstance);

// 解绑用户从实例
router.delete('/api/mcsm/users/:userId/instances/:instanceId/bind', requireAdminAuth, unbindUserFromInstance);

// 获取用户绑定的实例列表
router.get('/api/mcsm/users/:userId/instances', requireAdminAuth, getUserInstances);

// 获取实例绑定的用户列表
router.get('/api/mcsm/instances/:instanceId/users', requireAdminAuth, getInstanceUsers);

// 用户获取自己的实例列表
router.get('/api/user/instances', requireUserAuth, getOwnInstances);

// 用户发送命令到自己的实例
router.post('/api/user/instances/:instanceId/command', requireUserAuth, sendCommandToOwnInstance);

// 用户获取自己实例的控制台日志
router.get('/api/user/instances/:instanceId/log', requireUserAuth, getOwnInstanceLog);

module.exports = router;