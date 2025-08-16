const MCSMClient = require('../mcsmClient.js');
const mcsmDao = require('../db/mcsmDao');

const MCSM_CONFIG = {
  baseUrl: process.env.MCSM_BASE_URL || 'http://your-mcsm-panel.com',
  apiKey: process.env.MCSM_API_KEY || 'your-api-key-here'
};

const mcsm = new MCSMClient(MCSM_CONFIG.baseUrl, MCSM_CONFIG.apiKey);

// 启动MCSM实例
async function startInstance(req, res) {
  const { instanceId } = req.params;
  
  try {
    const result = await mcsm.startServer(instanceId);
    await mcsmDao.updateInstanceStatus(instanceId, 'running');
    
    res.json({
      success: true,
      message: '实例启动成功',
      data: result
    });
  } catch (error) {
    console.error('启动MCSM实例失败:', error);
    res.status(500).json({
      success: false,
      message: '启动实例失败: ' + error.message
    });
  }
}

// 停止MCSM实例
async function stopInstance(req, res) {
  const { instanceId } = req.params;
  
  try {
    const result = await mcsm.stopServer(instanceId);
    await mcsmDao.updateInstanceStatus(instanceId, 'stopped');
    
    res.json({
      success: true,
      message: '实例停止成功',
      data: result
    });
  } catch (error) {
    console.error('停止MCSM实例失败:', error);
    res.status(500).json({
      success: false,
      message: '停止实例失败: ' + error.message
    });
  }
}

// 重启MCSM实例
async function restartInstance(req, res) {
  const { instanceId } = req.params;
  
  try {
    const result = await mcsm.restartServer(instanceId);
    await mcsmDao.updateInstanceStatus(instanceId, 'running');
    
    res.json({
      success: true,
      message: '实例重启成功',
      data: result
    });
  } catch (error) {
    console.error('重启MCSM实例失败:', error);
    res.status(500).json({
      success: false,
      message: '重启实例失败: ' + error.message
    });
  }
}

// 发送命令到MCSM实例
async function sendCommand(req, res) {
  const { instanceId } = req.params;
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({
      success: false,
      message: '命令是必填项'
    });
  }
  
  try {
    const result = await mcsm.sendCommand(instanceId, command);
    res.json({
      success: true,
      message: '命令发送成功',
      data: result
    });
  } catch (error) {
    console.error('发送命令失败:', error);
    res.status(500).json({
      success: false,
      message: '发送命令失败: ' + error.message
    });
  }
}

// 获取MCSM实例控制台日志
async function getInstanceLog(req, res) {
  const { instanceId } = req.params;
  const { lines = 50 } = req.query;
  
  try {
    const logs = await mcsm.getConsoleLog(instanceId, parseInt(lines));
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('获取控制台日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取控制台日志失败: ' + error.message
    });
  }
}

// 更改MCSM实例端口
async function changeInstancePort(req, res) {
  const { instanceId } = req.params;
  const { port } = req.body;
  
  if (!port || port < 1 || port > 65535) {
    return res.status(400).json({
      success: false,
      message: '端口号必须是1-65535之间的数字'
    });
  }
  
  try {
    const result = await mcsm.changeInstancePort(instanceId, port);
    await mcsmDao.updateInstancePort(instanceId, port);
    
    res.json({
      success: true,
      message: '端口更改成功',
      data: result
    });
  } catch (error) {
    console.error('更改实例端口失败:', error);
    res.status(500).json({
      success: false,
      message: '更改端口失败: ' + error.message
    });
  }
}

// 获取所有MCSM用户
async function getAllUsers(req, res) {
  try {
    const users = await mcsm.getUsers();
    
    // 同步用户信息到数据库
    for (const user of users) {
      await mcsmDao.saveMcsmUser({
        mcsm_user_id: user.uuid,
        username: user.userName,
        password: user.password || '',
        permission: user.permission
      });
    }
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('获取MCSM用户失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户失败: ' + error.message
    });
  }
}

// 创建MCSM用户
async function createUser(req, res) {
  const { username, password, permission = 'user' } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名和密码是必填项'
    });
  }
  
  try {
    const result = await mcsm.createUser({
      userName: username,
      password: password,
      permission: permission
    });
    
    // 保存到数据库
    await mcsmDao.saveMcsmUser({
      mcsm_user_id: result.data.uuid,
      username: username,
      password: password,
      permission: permission
    });
    
    res.json({
      success: true,
      message: '用户创建成功',
      data: result
    });
  } catch (error) {
    console.error('创建MCSM用户失败:', error);
    res.status(500).json({
      success: false,
      message: '创建用户失败: ' + error.message
    });
  }
}

// 删除MCSM用户
async function deleteUser(req, res) {
  const { userId } = req.params;
  
  try {
    const result = await mcsm.deleteUser(userId);
    await mcsmDao.deleteMcsmUser(userId);
    
    res.json({
      success: true,
      message: '用户删除成功',
      data: result
    });
  } catch (error) {
    console.error('删除MCSM用户失败:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败: ' + error.message
    });
  }
}

// 绑定用户到实例
async function bindUserToInstance(req, res) {
  const { userId, instanceId } = req.params;
  const { permissions = ['read'] } = req.body;
  
  try {
    const result = await mcsm.bindUserToInstance(userId, instanceId, permissions);
    await mcsmDao.bindUserToInstance(userId, instanceId, permissions);
    
    res.json({
      success: true,
      message: '用户绑定成功',
      data: result
    });
  } catch (error) {
    console.error('绑定用户到实例失败:', error);
    res.status(500).json({
      success: false,
      message: '绑定失败: ' + error.message
    });
  }
}

// 解绑用户从实例
async function unbindUserFromInstance(req, res) {
  const { userId, instanceId } = req.params;
  
  try {
    const result = await mcsm.unbindUserFromInstance(userId, instanceId);
    await mcsmDao.unbindUserFromInstance(userId, instanceId);
    
    res.json({
      success: true,
      message: '用户解绑成功',
      data: result
    });
  } catch (error) {
    console.error('解绑用户从实例失败:', error);
    res.status(500).json({
      success: false,
      message: '解绑失败: ' + error.message
    });
  }
}

// 获取用户绑定的实例列表
async function getUserInstances(req, res) {
  const { userId } = req.params;
  
  try {
    const instances = await mcsmDao.getUserInstances(userId);
    res.json({
      success: true,
      data: instances
    });
  } catch (error) {
    console.error('获取用户实例失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户实例失败: ' + error.message
    });
  }
}

// 获取实例绑定的用户列表
async function getInstanceUsers(req, res) {
  const { instanceId } = req.params;
  
  try {
    const users = await mcsmDao.getInstanceUsers(instanceId);
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('获取实例用户失败:', error);
    res.status(500).json({
      success: false,
      message: '获取实例用户失败: ' + error.message
    });
  }
}

// 用户获取自己的实例列表
async function getOwnInstances(req, res) {
  const userId = req.user.id;
  
  try {
    const instances = await mcsmDao.getUserInstances(userId);
    res.json({
      success: true,
      data: instances
    });
  } catch (error) {
    console.error('获取用户实例失败:', error);
    res.status(500).json({
      success: false,
      message: '获取实例失败: ' + error.message
    });
  }
}

// 用户发送命令到自己的实例
async function sendCommandToOwnInstance(req, res) {
  const { instanceId } = req.params;
  const { command } = req.body;
  const userId = req.user.id;
  
  if (!command) {
    return res.status(400).json({
      success: false,
      message: '命令是必填项'
    });
  }
  
  try {
    // 检查用户是否有权限操作此实例
    const hasPermission = await mcsmDao.checkUserInstancePermission(userId, instanceId, 'write');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '没有权限操作此实例'
      });
    }
    
    const result = await mcsm.sendCommand(instanceId, command);
    res.json({
      success: true,
      message: '命令发送成功',
      data: result
    });
  } catch (error) {
    console.error('发送命令失败:', error);
    res.status(500).json({
      success: false,
      message: '发送命令失败: ' + error.message
    });
  }
}

// 用户获取自己实例的控制台日志
async function getOwnInstanceLog(req, res) {
  const { instanceId } = req.params;
  const { lines = 50 } = req.query;
  const userId = req.user.id;
  
  try {
    // 检查用户是否有权限查看此实例
    const hasPermission = await mcsmDao.checkUserInstancePermission(userId, instanceId, 'read');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '没有权限查看此实例'
      });
    }
    
    const logs = await mcsm.getConsoleLog(instanceId, parseInt(lines));
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('获取控制台日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取控制台日志失败: ' + error.message
    });
  }
}

module.exports = {
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
};