# 机械臂控制助手

基于Web的实时机械臂控制与可视化工具，使用Vue3 + Three.js前端和FastAPI模拟后端。

## 功能特性

- 🎮 实时机械臂控制界面
- 🎯 3D可视化机械臂模型
- 🔗 WebSocket双向通信
- 📊 关节角度精确控制
- 🎨 直观的用户界面
- 🔄 自动重连机制

## 技术栈

### 前端
- Vue 3 (组合式API)
- TypeScript
- Three.js (3D渲染)
- Pinia (状态管理)
- Vite (构建工具)

### 后端
- FastAPI (WebSocket服务)
- Python 3.8+

## 项目结构

```
WSRobotClient/
├── frontend/                 # Vue3前端应用
│   ├── src/
│   │   ├── components/       # Vue组件
│   │   ├── composables/     # 组合式函数
│   │   ├── stores/          # Pinia状态管理
│   │   ├── types/           # TypeScript类型定义
│   │   └── App.vue          # 主应用组件
│   └── package.json
├── mock-server/             # Python模拟后端
│   ├── main.py             # FastAPI服务
│   ├── robot_config.py     # 机械臂配置
│   └── requirements.txt    # Python依赖
├── DESIGN.MD               # 详细设计方案
└── README.md              # 项目说明
```

## 快速开始

### 1. 启动后端服务

```bash
cd mock-server
pip install -r requirements.txt
python main.py
```

后端服务将在 http://localhost:8000 启动。

### 2. 启动前端应用

```bash
cd frontend
npm install
npm run dev
```

前端应用将在 http://localhost:5173 启动。

### 3. 访问应用

1. 打开浏览器访问 http://localhost:5173
2. 在连接栏输入WebSocket URL: `ws://localhost:8000/ws/six_axis`
3. 点击"连接"按钮
4. 开始控制机械臂

## 使用说明

### 连接设置
- **WebSocket URL**: 后端WebSocket服务地址
- **机械臂类型**: 选择6轴工业机械臂或SCARA机器人

### 控制面板
- **关节控制**: 每个关节都有滑块和数值输入
- **关节类型**: 
  - 水平旋转底座 (flex_w)
  - 垂直旋转底座 (flex_v) 
  - 一般关节 (joint)
  - 夹爪 (gripper)
- **复位功能**: 可将关节角度重置为默认值

### 3D可视化
- **交互控制**: 鼠标拖拽旋转视角，滚轮缩放
- **关节选择**: 点击控制面板中的关节可高亮显示
- **实时更新**: 关节角度变化实时反映在3D模型中

## 机械臂配置

### 6轴工业机械臂
- base: 底座水平旋转 (-180° ~ 180°)
- shoulder: 肩关节 (-90° ~ 90°)
- elbow: 肘关节 (-135° ~ 135°)
- wrist1: 腕关节1 (-180° ~ 180°)
- wrist2: 腕关节2 (-90° ~ 90°)
- gripper: 夹爪 (0 ~ 100%)

### SCARA机器人
- waist: 腰部旋转 (-170° ~ 170°)
- arm1: 臂1关节 (-150° ~ 150°)
- arm2: 臂2关节 (-150° ~ 150°)
- wrist: 腕关节 (-360° ~ 360°)
- gripper: 夹爪 (0 ~ 100%)

## 开发指南

### 前端开发
```bash
cd frontend
npm run dev          # 开发模式
npm run build        # 生产构建
npm run preview      # 预览构建结果
```

### 后端开发
```bash
cd mock-server
python main.py       # 启动开发服务器
```

### 添加新的机械臂配置
1. 在 `mock-server/robot_config.py` 中添加新的配置
2. 更新 `mock-server/main.py` 中的机器人类型映射
3. 在前端 `ConnectionBar.vue` 中添加对应的选项

## 扩展功能

计划中的扩展功能：
1. **轨迹录制**: 记录和回放关节运动序列
2. **碰撞检测**: 添加简单的自碰撞检测
3. **多机械臂支持**: 同时控制多个机械臂
4. **导出配置**: 将当前状态导出为配置文件
5. **真实硬件对接**: 支持真实机械臂控制

## 许可证

MIT License