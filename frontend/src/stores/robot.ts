import { defineStore } from 'pinia'
import type { Joint, JointState } from '@/types/ws'
import { debounceWithImmediate } from '@/utils/debounce'

// WebSocket功能接口
interface WebSocketFunctions {
  sendMoveCommand: (jointId: string, angle: number) => void
  isConnected: { value: boolean }
}

let webSocketFunctions: WebSocketFunctions | null = null

// 防抖发送函数缓存
const debouncedSendCommands = new Map<string, ReturnType<typeof debounceWithImmediate>>()

// 状态锁：跟踪正在发送命令的关节，防止在发送过程中更新本地状态
const sendingCommands = new Set<string>()

export const useRobotStore = defineStore('robot', {
  state: () => ({
    robotId: null as string | null,
    joints: new Map<string, JointState>(),
    connectionStatus: 'disconnected' as 'disconnected' | 'connecting' | 'connected',
    selectedJoint: null as string | null
  }),
  
  getters: {
    jointList: (state) => Array.from(state.joints.values()),
    jointCount: (state) => state.joints.size,
    selectedJointState: (state) => {
      if (!state.selectedJoint) return null
      return state.joints.get(state.selectedJoint) || null
    },
    isWebSocketAvailable: () => webSocketFunctions !== null,
    jointAngles: (state) => {
      const angles: Record<string, number> = {}
      state.joints.forEach((joint, id) => {
        angles[id] = joint.currentAngle
      })
      return angles
    }
  },
  
  actions: {
    // 注入WebSocket功能
    setWebSocketFunctions(functions: WebSocketFunctions) {
      webSocketFunctions = functions
    },
    
    initRobot(robotId: string, joints: Joint[]) {
      this.robotId = robotId
      this.joints.clear()
      
      joints.forEach(joint => {
        this.joints.set(joint.id, {
          ...joint,
          currentAngle: joint.default
        })
      })
    },
    
    updateJointAngle(jointId: string, angle: number, sendToServer: boolean = true) {
      const joint = this.joints.get(jointId)
      if (joint) {
        const clampedAngle = this.clampAngle(angle, joint.range)
        
        // 如果正在向服务器发送命令，跳过本地更新（等待服务器确认）
        if (sendingCommands.has(jointId)) {
          console.log(`关节 ${jointId} 正在发送命令，跳过本地更新`)
          return
        }
        
        joint.currentAngle = clampedAngle
        
        // 自动发送到服务器（如果WebSocket可用且已连接，且需要发送）
        if (sendToServer && webSocketFunctions?.isConnected.value) {
          sendingCommands.add(jointId)
          this.sendDebouncedCommand(jointId, clampedAngle)
        }
      }
    },
    
    // 防抖发送命令
    sendDebouncedCommand(jointId: string, angle: number) {
      if (!webSocketFunctions) {
        sendingCommands.delete(jointId)
        return
      }
      
      // 为每个关节创建或获取防抖函数
      let debouncedSend = debouncedSendCommands.get(jointId)
      if (!debouncedSend) {
        debouncedSend = debounceWithImmediate(
          (id: string, ang: number) => {
            console.log(`发送关节 ${id} 角度: ${ang}°`)
            webSocketFunctions!.sendMoveCommand(id, ang)
            // 命令已发送，但需要等待服务器确认后才能移除锁
            // 锁将在服务器确认后由handleMoveAck移除
          },
          150, // 150ms防抖延迟，避免快速操作冲突
          true // 立即执行第一次
        )
        debouncedSendCommands.set(jointId, debouncedSend)
      }
      
      // 调用防抖函数
      debouncedSend(jointId, angle)
    },
    
    resetAllJoints() {
      this.joints.forEach((joint: JointState) => {
        const defaultAngle = joint.default
        // 使用updateJointAngle自动发送到服务器
        this.updateJointAngle(joint.id, defaultAngle, true)
      })
    },
    
    clampAngle(angle: number, range: [number, number]): number {
      return Math.min(Math.max(angle, range[0]), range[1])
    },
    
    setConnectionStatus(status: 'disconnected' | 'connecting' | 'connected') {
      this.connectionStatus = status
    },
    
    selectJoint(jointId: string | null) {
      this.selectedJoint = jointId
    },
    
    // 清理机器人状态
    clearRobot() {
      this.robotId = null
      this.joints.clear()
      this.selectedJoint = null
      this.connectionStatus = 'disconnected'
      
      // 清除防抖缓存和状态锁
      debouncedSendCommands.clear()
      sendingCommands.clear()
      
      console.log('机器人状态已清理')
    },
    
    // 强制更新连接状态（用于状态同步）
    forceConnectionStatus(status: 'disconnected' | 'connecting' | 'connected') {
      this.connectionStatus = status
      console.log(`强制更新连接状态: ${status}`)
    }
  }
})