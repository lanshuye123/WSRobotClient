# WSRobotClient - 智能编码代理指南

本文档为在WSRobotClient项目中工作的智能编码代理提供指导，包括构建命令、代码检查、测试命令和代码风格规范。

## 项目概述

WSRobotClient是一个基于Web的实时机械臂控制与可视化工具，包含：
- **前端**: Vue 3 + TypeScript + Three.js + Pinia + Vite
- **后端**: FastAPI + Python WebSocket模拟服务

## 构建/代码检查/测试命令

### 前端 (Vue 3 + TypeScript)

#### 开发环境
```bash
cd frontend
npm install          # 安装依赖
npm run dev          # 启动开发服务器 (http://localhost:5173)
```

#### 构建和类型检查
```bash
cd frontend
npm run build        # 生产构建（同时运行类型检查）
npm run build-only   # 仅构建（不运行类型检查）
npm run type-check   # 仅运行TypeScript类型检查
npm run preview      # 预览生产构建结果
```

#### 代码质量检查
```bash
# TypeScript类型检查（推荐在提交前运行）
cd frontend && npm run type-check

# 检查Vue组件语法
cd frontend && npx vue-tsc --noEmit
```

### 后端 (FastAPI + Python)

#### 开发环境
```bash
cd mock-server
pip install -r requirements.txt  # 安装Python依赖
python main.py                   # 启动开发服务器 (http://localhost:8000)
```

#### 代码质量检查
```bash
# Python代码格式化（使用ruff）
cd mock-server
ruff format .                    # 格式化代码
ruff check .                     # 检查代码质量
ruff check --fix .               # 自动修复可修复的问题
```

### 完整项目启动
```bash
# 使用项目根目录的启动脚本
./start.sh
```

## 代码风格指南

### 总体原则
1. **一致性优先**: 遵循现有代码的约定和模式
2. **类型安全**: 充分利用TypeScript的类型系统
3. **可维护性**: 编写清晰、自解释的代码
4. **错误处理**: 优雅地处理边界情况和错误

### 前端代码规范 (Vue 3 + TypeScript)

#### 文件结构
```
frontend/src/
├── components/     # Vue组件（PascalCase命名）
├── composables/    # 组合式函数（use前缀，camelCase）
├── stores/         # Pinia状态管理（camelCase）
├── types/          # TypeScript类型定义（PascalCase）
├── router/         # 路由配置
└── views/          # 页面组件（PascalCase）
```

#### Vue组件规范
```vue
<!-- 组件命名: PascalCase -->
<!-- 模板: 使用kebab-case属性 -->
<template>
  <div class="component-name">
    <ChildComponent 
      :prop-name="value"
      @event-name="handler"
    />
  </div>
</template>

<!-- 脚本: 使用组合式API，严格类型 -->
<script setup lang="ts">
// 导入顺序: 1. Vue/框架API 2. 第三方库 3. 本地模块
import { ref, computed, onMounted } from 'vue'
import { useStore } from '@/stores/store'
import type { User } from '@/types/user'

// Props定义（使用defineProps）
const props = defineProps<{
  userId: number
  userName?: string
}>()

// Emits定义（使用defineEmits）
const emit = defineEmits<{
  (e: 'update:name', value: string): void
  (e: 'delete'): void
}>()

// 响应式状态（使用ref/reactive）
const count = ref(0)
const user = reactive({ name: '', age: 0 })

// 计算属性（使用computed）
const fullName = computed(() => `${user.name} (${user.age})`)

// 方法（camelCase命名）
const handleClick = () => {
  // 业务逻辑
}

// 生命周期
onMounted(() => {
  // 初始化逻辑
})
</script>

<!-- 样式: 使用scoped CSS -->
<style scoped>
.component-name {
  /* 组件样式 */
}
</style>
```

#### TypeScript类型规范
```typescript
// 类型定义使用PascalCase
interface RobotJoint {
  id: string
  name: string
  type: 'flex_w' | 'flex_v' | 'joint' | 'gripper'
  min: number
  max: number
  default: number
  current: number
}

// 使用类型别名
type JointType = 'flex_w' | 'flex_v' | 'joint' | 'gripper'

// 枚举使用PascalCase
enum ConnectionStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected'
}

// 函数类型定义
type MoveCommand = (jointId: string, angle: number) => void

// 泛型使用
function createStore<T>(initialState: T): Store<T> {
  // 实现
}
```

#### 命名约定
- **组件**: `PascalCase` (如 `ControlPanel.vue`, `ThreeViewer.vue`)
- **组合式函数**: `useCamelCase` (如 `useWebSocket.ts`)
- **工具函数**: `camelCase` (如 `formatAngle.ts`)
- **常量**: `UPPER_SNAKE_CASE` (如 `MAX_RECONNECT_ATTEMPTS`)
- **接口/类型**: `PascalCase` (如 `RobotConfig`, `JointState`)
- **变量**: `camelCase` (如 `jointAngle`, `connectionStatus`)
- **CSS类**: `kebab-case` (如 `.control-panel`, `.joint-slider`)

#### 导入规范
```typescript
// 1. Vue/框架导入
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 2. 第三方库导入
import axios from 'axios'
import * as THREE from 'three'

// 3. 类型导入（使用import type）
import type { RobotJoint } from '@/types/robot'

// 4. 本地模块导入（使用@别名）
import { useRobotStore } from '@/stores/robot'
import ControlPanel from '@/components/ControlPanel.vue'

// 5. 样式导入（如果需要）
import './styles.css'
```

#### 错误处理
```typescript
// WebSocket错误处理示例（参考useWebSocket.ts）
try {
  const data = JSON.parse(event.data)
  // 处理数据
} catch (error) {
  console.error('消息解析失败:', error, '原始数据:', event.data)
  error.value = '消息解析失败'
  // 提供用户友好的错误信息
}

// 异步操作错误处理
const fetchData = async () => {
  try {
    const response = await axios.get('/api/data')
    return response.data
  } catch (error) {
    console.error('获取数据失败:', error)
    // 返回默认值或抛出特定错误
    throw new Error('数据获取失败')
  }
}
```

### 后端代码规范 (Python + FastAPI)

#### 文件结构
```
mock-server/
├── main.py          # FastAPI主应用
├── robot_config.py  # 机械臂配置
├── requirements.txt # Python依赖
└── venv/           # 虚拟环境（不提交）
```

#### Python代码规范
```python
# 导入顺序: 1. 标准库 2. 第三方库 3. 本地模块
import json
from typing import Dict, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from robot_config import SIX_AXIS_ROBOT, SCARA_ROBOT

# 常量使用UPPER_SNAKE_CASE
MAX_CONNECTIONS = 100
HEARTBEAT_INTERVAL = 30

# 函数使用snake_case
async def handle_websocket_message(websocket: WebSocket, data: Dict):
    """处理WebSocket消息
    
    Args:
        websocket: WebSocket连接对象
        data: 解析后的消息数据
        
    Returns:
        bool: 处理是否成功
    """
    try:
        # 业务逻辑
        return True
    except Exception as e:
        print(f"处理消息失败: {e}")
        return False

# 类使用PascalCase
class RobotManager:
    """机械臂管理器"""
    
    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}
    
    async def add_connection(self, robot_id: str, websocket: WebSocket):
        """添加机械臂连接"""
        self.connections[robot_id] = websocket
```

#### 类型提示
```python
from typing import Dict, List, Optional, Union

# 使用类型提示
def calculate_angle(
    current: float, 
    target: float, 
    speed: float = 1.0
) -> float:
    """计算目标角度
    
    Args:
        current: 当前角度
        target: 目标角度
        speed: 移动速度系数
        
    Returns:
        计算后的角度
    """
    return current + (target - current) * speed

# 复杂类型使用TypeDict或dataclass
from typing import TypedDict

class JointConfig(TypedDict):
    id: str
    name: str
    min: float
    max: float
    default: float
```

### 通用开发规范

#### 提交消息规范
```
类型(范围): 简短描述

详细描述（可选）

- 功能变更说明
- 修复的问题
- 破坏性变更说明

关联问题: #123
```

类型包括：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变更

#### 代码审查要点
1. **功能正确性**: 代码是否按预期工作
2. **类型安全**: TypeScript/Python类型是否正确使用
3. **错误处理**: 是否妥善处理边界情况和错误
4. **性能考虑**: 是否有潜在的性能问题
5. **可读性**: 代码是否清晰易懂
6. **测试覆盖**: 是否有相应的测试
7. **文档更新**: 相关文档是否同步更新

#### 调试技巧
```bash
# 前端调试
cd frontend && npm run dev
# 打开浏览器开发者工具查看控制台日志

# 后端调试
cd mock-server && python -m pdb main.py
# 或使用print调试

# WebSocket调试
# 使用浏览器WebSocket工具或wscat
```

## 扩展开发指南

### 添加新的机械臂类型
1. 在 `mock-server/robot_config.py` 中添加配置
2. 更新 `mock-server/main.py` 中的机器人类型映射
3. 在前端 `ConnectionBar.vue` 中添加选项
4. 更新前端类型定义

### 添加新功能组件
1. 在 `frontend/src/components/` 创建Vue组件
2. 遵循现有组件的结构和命名约定
3. 添加TypeScript类型定义
4. 更新路由（如果需要）
5. 添加样式

### 动作录制功能开发指南
动作录制功能已实现，包含以下组件和模块：

#### 文件结构
```
frontend/src/
├── components/
│   ├── RecordingPanel.vue      # 录制控制面板
│   └── PlaybackControls.vue    # 回放控制组件
├── composables/
│   └── useRecording.ts         # 录制和回放逻辑
├── stores/
│   ├── recording.ts            # 录制状态管理
│   └── ui.ts                   # 界面状态管理（新增）
├── types/
│   └── recording.ts            # 录制相关类型定义
└── utils/
    └── recordingUtils.ts       # 录制工具函数
```

#### 核心功能
1. **录制**: 50ms采样间隔记录关节角度
2. **回放**: 支持播放、暂停、停止、循环播放
3. **管理**: 录制列表、重命名、删除、导入导出
4. **持久化**: localStorage存储录制数据
5. **可折叠界面**: 录制和回放面板可展开/收起

#### 使用示例
```typescript
// 开始录制
recording.startRecording()

// 暂停录制
recording.pauseRecording()

// 停止录制
recording.stopRecording()

// 开始回放
recording.startPlayback(recordingId)

// 导出录制
recording.exportRecording(recordingId)

// 导入录制
await recording.importRecording(file)
```

#### 数据格式
```json
{
  "id": "rec_1741766400000_abc123",
  "name": "录制名称",
  "robotId": "six_axis_robot",
  "createdAt": 1741766400000,
  "duration": 5000,
  "frames": [
    {
      "timestamp": 0,
      "joints": {
        "base": 0,
        "shoulder": 0,
        "elbow": 0
      }
    }
  ],
  "metadata": {
    "description": "录制描述",
    "tags": ["tag1", "tag2"],
    "version": "1.0.0"
  }
}
```

### 状态管理最佳实践
1. 使用Pinia进行状态管理
2. 将业务逻辑放在stores中
3. 组件只负责UI渲染和用户交互
4. 使用组合式函数复用逻辑

## 故障排除

### 常见问题
1. **TypeScript编译错误**: 运行 `npm run type-check` 查看详细错误
2. **Vue组件导入错误**: 检查路径别名和文件扩展名
3. **WebSocket连接失败**: 检查后端服务是否运行，CORS配置
4. **Python依赖问题**: 使用虚拟环境，确保requirements.txt正确

### 性能优化建议
1. 使用Vue的响应式系统高效更新UI
2. Three.js渲染优化：减少draw calls，使用instanced mesh
3. WebSocket消息优化：避免频繁发送小消息
4. 组件懒加载：使用Vue Router的懒加载

## 相关资源

- [Vue 3文档](https://vuejs.org/)
- [TypeScript文档](https://www.typescriptlang.org/)
- [Three.js文档](https://threejs.org/docs/)
- [FastAPI文档](https://fastapi.tiangolo.com/)
- [Pinia文档](https://pinia.vuejs.org/)
- [Vite文档](https://vitejs.dev/)
