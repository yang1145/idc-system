// 服务器配置数据
const servers = [
  {
    id: 1,
    name: '入门型',
    description: '适合小型网站和轻量级应用',
    cpu: 1,
    memory: 2,
    disk: 50,
    bandwidth: 100,
    ports: 3
  },
  {
    id: 2,
    name: '标准型',
    description: '适合中型企业网站和应用',
    cpu: 2,
    memory: 4,
    disk: 100,
    bandwidth: 200,
    ports: 5
  },
  {
    id: 3,
    name: '高性能型',
    description: '适合大型应用和高并发场景',
    cpu: 4,
    memory: 16,
    disk: 500,
    bandwidth: 500,
    ports: 10
  },
  {
    id: 4,
    name: '企业型',
    description: '适合大型企业级应用和数据库服务',
    cpu: 8,
    memory: 32,
    disk: 1000,
    bandwidth: 1000,
    ports: 20
  }
];

// 价格参数
const priceParams = {
  cpu: 10,
  memory: 5,
  disk: 0.1,
  bandwidth: 0.5,
  port: 2
};

// 获取所有服务器配置
function getAllServers(req, res) {
  res.json({
    success: true,
    data: servers
  });
}

// 根据ID获取特定服务器配置
function getServerById(req, res) {
  const id = parseInt(req.params.id);
  const server = servers.find(s => s.id === id);
  
  if (!server) {
    return res.status(404).json({
      success: false,
      message: '服务器配置未找到'
    });
  }
  
  res.json({
    success: true,
    data: server
  });
}

// 计算服务器价格
function calculatePrice(req, res) {
  const { cpu, memory, disk, bandwidth, ports, months } = req.body;
  
  // 验证参数
  if (!cpu || !memory || !disk || !bandwidth || !ports || !months) {
    return res.status(400).json({
      success: false,
      message: '缺少必要的参数'
    });
  }
  
  // 计算价格
  const cpuCost = cpu * priceParams.cpu;
  const memoryCost = memory * priceParams.memory;
  const diskCost = disk * priceParams.disk;
  const bandwidthCost = bandwidth * priceParams.bandwidth;
  const portCost = ports * priceParams.port;
  
  const monthlyCost = cpuCost + memoryCost + diskCost + bandwidthCost + portCost;
  const totalCost = monthlyCost * months;
  
  res.json({
    success: true,
    data: {
      monthlyCost: monthlyCost.toFixed(2),
      totalCost: totalCost.toFixed(2),
      details: {
        cpuCost: cpuCost.toFixed(2),
        memoryCost: memoryCost.toFixed(2),
        diskCost: diskCost.toFixed(2),
        bandwidthCost: bandwidthCost.toFixed(2),
        portCost: portCost.toFixed(2)
      }
    }
  });
}

module.exports = {
  getAllServers,
  getServerById,
  calculatePrice
};