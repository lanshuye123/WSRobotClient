# 机械臂控制助手 - 完整设计方案

## 1. 项目概述

机械臂控制助手是一个基于Web的实时机械臂控制与可视化工具。系统由Vue3前端控制界面和Python模拟后端组成，通过WebSocket实现双向通信，提供直观的3D可视化控制体验。

## 2. 技术栈选型

### 前端
- **框架**: Vite + Vue3 (组合式API)
- **3D渲染**: Three.js (r128+)
- **UI组件**: Naive UI / Element Plus (滑块组件)
- **WebSocket**: 原生WebSocket + 重连机制
- **状态管理**: Pinia
- **HTTP请求**: Axios

### 后端
- **框架**: FastAPI / Flask + WebSocket
- **模拟数据**: 预定义机械臂配置
- **跨域**: CORS中间件

## 3. 系统架构

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│                 │ ◄──────────────► │                 │
│   Vue3前端应用  │   JSON协议       │  Python模拟后端 │
│                 │                  │                 │
└────────┬────────┘                  └─────────────────┘
         │
    ┌────┴────┐
    │ Three.js│
    │  3D场景 │
    └─────────┘
```

## 4. 前端详细设计

### 4.1 目录结构
```
src/
├── components/
│   ├── ControlPanel.vue      # 控制面板
│   ├── ThreeViewer.vue       # 3D可视化组件
│   ├── JointSlider.vue       # 关节滑块组件
│   └── ConnectionBar.vue     # 连接状态栏
├── composables/
│   └── useWebSocket.ts       # WebSocket组合式函数
├── stores/
│   └── robotStore.ts         # Pinia状态管理
├── types/
│   └── ws.d.ts               # TypeScript类型定义
├── utils/
│   ├── robotBuilder.ts       # 机械臂模型构建
│   └── kinematics.ts         # 运动学计算
└── App.vue
```

### 4.2 核心状态管理 (robotStore.ts)

```typescript
import { defineStore } from 'pinia'
import type { InitResponse, Joint, MoveRequest } from '@/types/ws'

interface RobotState {
  robotId: string | null
  joints: Map<string, Joint & { currentAngle: number }>
  connectionStatus: 'disconnected' | 'connecting' | 'connected'
  selectedJoint: string | null
}

export const useRobotStore = defineStore('robot', {
  state: (): RobotState => ({
    robotId: null,
    joints: new Map(),
    connectionStatus: 'disconnected',
    selectedJoint: null
  }),
  
  getters: {
    jointList: (state) => Array.from(state.joints.values()),
    jointCount: (state) => state.joints.size
  },
  
  actions: {
    updateJointAngle(jointId: string, angle: number) {
      const joint = this.joints.get(jointId)
      if (joint) {
        joint.currentAngle = this.clampAngle(angle, joint.range)
      }
    },
    
    clampAngle(angle: number, range: number[]): number {
      return Math.min(Math.max(angle, range[0]), range[1])
    }
  }
})
```

### 4.3 WebSocket通信封装 (useWebSocket.ts)

```typescript
import { ref } from 'vue'
import type { InitResponse, MoveRequest } from '@/types/ws'

export function useWebSocket() {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const error = ref<string | null>(null)

  const connect = (url: string) => {
    ws.value = new WebSocket(url)
    
    ws.value.onopen = () => {
      isConnected.value = true
      error.value = null
    }
    
    ws.value.onmessage = (event) => {
      try {
        const data: InitResponse = JSON.parse(event.data)
        handleInitMessage(data)
      } catch (e) {
        error.value = '消息解析失败'
      }
    }
    
    ws.value.onclose = () => {
      isConnected.value = false
      // 自动重连逻辑
      setTimeout(() => reconnect(url), 3000)
    }
  }

  const sendMoveCommand = (jointId: string, angle: number) => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      const command: MoveRequest = { id: jointId, angel: angle }
      ws.value.send(JSON.stringify(command))
    }
  }

  return { connect, sendMoveCommand, isConnected, error }
}
```

### 4.4 3D可视化实现

#### 关节类型映射
- **flex_w (水平旋转底座)**: 绕Y轴旋转的圆柱体
- **flex_v (垂直旋转底座)**: 绕X/Z轴旋转的立方体
- **joint (一般关节)**: 带旋转范围的连杆
- **gripper (夹爪)**: 两个可开合的夹持部件

#### 坐标系统
- 使用右手坐标系，Y轴向上
- 每个关节基于前一个关节的末端位置构建
- 通过`next`属性构建关节链

## 5. 后端模拟服务 (Python)

### 5.1 项目结构
```
mock-server/
├── main.py              # 主服务入口
├── robot_config.py      # 预定义机械臂配置
├── websocket_handler.py # WebSocket处理
└── requirements.txt     # 依赖
```

### 5.2 预定义机械臂配置 (robot_config.py)

```python
from typing import List, Dict, Any

# 6轴工业机械臂示例配置
SIX_AXIS_ROBOT = {
    "id": "robot_6dof_001",
    "joints": [
        {
            "id": "base",
            "range": [-180, 180],
            "default": 0,
            "type": "flex_w",
            "next": "shoulder"
        },
        {
            "id": "shoulder",
            "range": [-90, 90],
            "default": 45,
            "type": "joint",
            "next": "elbow"
        },
        {
            "id": "elbow",
            "range": [-135, 135],
            "default": -30,
            "type": "joint",
            "next": "wrist1"
        },
        {
            "id": "wrist1",
            "range": [-180, 180],
            "default": 0,
            "type": "flex_v",
            "next": "wrist2"
        },
        {
            "id": "wrist2",
            "range": [-90, 90],
            "default": 0,
            "type": "flex_v",
            "next": "gripper"
        },
        {
            "id": "gripper",
            "range": [0, 100],
            "default": 50,
            "type": "gripper",
            "next": None
        }
    ]
}

# SCARA机器人示例配置
SCARA_ROBOT = {
    "id": "scara_001",
    "joints": [
        {
            "id": "waist",
            "range": [-170, 170],
            "default": 0,
            "type": "flex_w",
            "next": "arm1"
        },
        {
            "id": "arm1",
            "range": [-150, 150],
            "default": 30,
            "type": "joint",
            "next": "arm2"
        },
        {
            "id": "arm2",
            "range": [-150, 150],
            "default": -45,
            "type": "joint",
            "next": "wrist"
        },
        {
            "id": "wrist",
            "range": [-360, 360],
            "default": 0,
            "type": "flex_v",
            "next": "gripper"
        },
        {
            "id": "gripper",
            "range": [0, 100],
            "default": 30,
            "type": "gripper",
            "next": None
        }
    ]
}
```

### 5.3 WebSocket服务实现 (main.py)

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import random
from robot_config import SIX_AXIS_ROBOT, SCARA_ROBOT

app = FastAPI()

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 存储当前连接的机械臂配置
active_robots = {}

@app.websocket("/ws/{robot_type}")
async def websocket_endpoint(websocket: WebSocket, robot_type: str = "six_axis"):
    await websocket.accept()
    
    # 根据请求类型选择机械臂配置
    if robot_type == "scara":
        robot_config = SCARA_ROBOT
    else:
        robot_config = SIX_AXIS_ROBOT
    
    # 发送初始化配置
    await websocket.send_json(robot_config)
    
    # 记录当前关节状态
    joint_states = {joint["id"]: joint["default"] 
                    for joint in robot_config["joints"]}
    
    try:
        while True:
            # 接收前端消息
            message = await websocket.receive_text()
            data = json.loads(message)
            
            # 处理移动请求
            if "id" in data and "angel" in data:
                joint_id = data["id"]
                target_angle = data["angel"]
                
                # 验证关节是否存在
                if joint_id in joint_states:
                    joint_states[joint_id] = target_angle
                    
                    # 模拟响应（可选：发送确认）
                    await websocket.send_json({
                        "type": "move_ack",
                        "joint": joint_id,
                        "angle": target_angle,
                        "status": "success"
                    })
                    
    except WebSocketDisconnect:
        print(f"Client disconnected for robot: {robot_type}")
    except Exception as e:
        print(f"Error: {e}")

@app.get("/api/robots")
async def get_robot_list():
    """返回可用的机械臂类型列表"""
    return {
        "robots": [
            {"id": "six_axis", "name": "6轴工业机械臂"},
            {"id": "scara", "name": "SCARA机器人"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 5.4 依赖文件 (requirements.txt)

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
websockets==12.0
python-multipart==0.0.6
```

## 6. 界面布局设计

### 控制区 (左侧/顶部)
- **连接栏**: WebSocket URL输入框 + 连接/断开按钮
- **状态指示**: 连接状态、机器人ID
- **关节控制面板**: 
  - 按关节类型分组显示
  - 滑块组件显示当前角度/范围
  - 数值输入框
  - 复位按钮
  - 夹爪控制特殊样式

### 演示区 (右侧/主要区域)
- **3D画布**: 全尺寸Three.js渲染
- **辅助工具**: 
  - 坐标系显示
  - 网格地面
  - 视角控制(旋转/缩放/平移)
  - 关节高亮选择

## 7. 实现要点

### 7.1 关节树构建
```typescript
// 根据joints数组和next关系构建树状结构
function buildJointTree(joints: Joint[]): JointNode {
  const jointMap = new Map(joints.map(j => [j.id, j]))
  // 找到根节点(没有其他节点指向的节点)
  // 构建层级关系
}
```

### 7.2 运动学模拟
- 使用DH参数法进行正向运动学计算
- 可视化时采用递推变换矩阵
- 夹爪单独处理开合动画

### 7.3 性能优化
- 使用requestAnimationFrame进行动画更新
- 滑块防抖处理，避免频繁发送WebSocket消息
- Three.js模型复用和实例化

## 8. 启动与部署

### 前端启动
```bash
yarn install
yarn run dev
```

### 后端启动
```bash
cd mock-server
pip install -r requirements.txt
python main.py
# 服务运行在 http://localhost:8000
```

### 访问应用
- 前端: http://localhost:5173
- WebSocket连接地址: ws://localhost:8000/ws/six_axis 或 ws://localhost:8000/ws/scara

## 9. 扩展可能性

1. **MoveAction响应**: 添加真实的运动学计算库
2. **多机械臂支持**: 同时连接和控制多个机械臂
3. **轨迹录制**: 记录和回放关节运动序列
4. **碰撞检测**: 添加简单的自碰撞检测
5. **导出配置**: 将当前关节状态导出为配置文件

这个设计方案提供了一个完整的机械臂控制助手实现框架，前后端分离，便于开发和测试。模拟后端支持多种机械臂配置，无需真实硬件即可演示完整的控制流程。