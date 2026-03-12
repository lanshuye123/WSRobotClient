import { ref, onUnmounted } from 'vue'
import { useRobotStore } from '@/stores/robot'
import type { InitResponse, MoveRequest, MoveAck } from '@/types/ws'

export function useWebSocket() {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  const robotStore = useRobotStore()
  
  let reconnectTimeout: number | null = null
  let reconnectAttempts = 0
  const MAX_RECONNECT_ATTEMPTS = 5
  
  // 连接状态管理
  let isManualDisconnect = false
  let currentConnectionId: string | null = null
  let currentConnectionUrl: string | null = null
  
  // 心跳机制
  let heartbeatInterval: number | null = null
  let lastPongTime: number = Date.now()
  const HEARTBEAT_INTERVAL = 30000 // 30秒
  const PONG_TIMEOUT = 45000 // 45秒

  const connect = (url: string) => {
    // 生成唯一连接ID
    const connectionId = Date.now().toString()
    currentConnectionId = connectionId
    currentConnectionUrl = url
    
    // 清理之前的连接
    cleanupPreviousConnection()
    
    console.log(`开始连接 [${connectionId}] -> ${url}`)
    updateConnectionStatus('connecting', connectionId)
    ws.value = new WebSocket(url)
    
    ws.value.onopen = () => {
      // 检查是否是当前活跃连接
      if (currentConnectionId !== connectionId) {
        console.log(`忽略旧连接 [${connectionId}] 的onopen事件，当前活跃连接: [${currentConnectionId}]`)
        try {
          ws.value?.close(1000, '连接已切换')
        } catch (e) {
          // 忽略错误
        }
        return
      }
      
      error.value = null
      reconnectAttempts = 0
      lastPongTime = Date.now()
      updateConnectionStatus('connected', connectionId)
      startHeartbeat()
      console.log(`WebSocket连接成功 [${connectionId}]`)
    }
    
    ws.value.onmessage = (event) => {
      // 检查是否是当前活跃连接
      if (currentConnectionId !== connectionId) {
        console.log(`忽略旧连接 [${connectionId}] 的消息，当前活跃连接: [${currentConnectionId}]`)
        return
      }
      
      try {
        const data = JSON.parse(event.data)
        
        if ('id' in data && 'joints' in data) {
          handleInitMessage(data as InitResponse)
        } else if ('type' in data && data.type === 'move_ack') {
          handleMoveAck(data as MoveAck)
        } else if ('type' in data && data.type === 'pong') {
          handlePong(data.timestamp || Date.now())
        } else {
          console.log(`收到未知消息类型 [${connectionId}]:`, data)
        }
      } catch (e) {
        console.error(`消息解析失败 [${connectionId}]:`, e, '原始数据:', event.data)
        error.value = '消息解析失败'
      }
    }
    
    ws.value.onerror = (event) => {
      // 检查是否是当前活跃连接
      if (currentConnectionId !== connectionId) {
        console.log(`忽略旧连接 [${connectionId}] 的错误事件`)
        return
      }
      
      error.value = 'WebSocket连接错误'
      updateConnectionStatus('disconnected', connectionId)
      console.error(`WebSocket连接错误 [${connectionId}]`)
    }
    
    ws.value.onclose = (event) => {
      stopHeartbeat()
      updateConnectionStatus('disconnected', connectionId)
      console.log(`WebSocket连接关闭 [${connectionId}]，代码: ${event.code}, 原因: ${event.reason}`)
      
      // 检查是否是当前活跃连接（防止旧连接事件干扰）
      if (currentConnectionId !== connectionId) {
        console.log(`忽略旧连接 [${connectionId}] 的关闭事件，当前活跃连接: [${currentConnectionId}]`)
        return
      }
      
      // 如果是用户主动断开，不进行重连
      if (isManualDisconnect) {
        console.log(`用户主动断开连接 [${connectionId}]，不进行重连`)
        isManualDisconnect = false
        currentConnectionId = null
        currentConnectionUrl = null
        return
      }
      
      // 意外断开，使用指数退避策略重连
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(3000 * Math.pow(1.5, reconnectAttempts), 30000)
        reconnectTimeout = setTimeout(() => {
          // 再次检查连接ID是否匹配
          if (currentConnectionId !== connectionId) {
            console.log(`连接已切换 [${connectionId}] -> [${currentConnectionId}]，停止重连`)
            return
          }
          
          reconnectAttempts++
          console.log(`第${reconnectAttempts}次重连尝试 [${connectionId}]，延迟: ${delay}ms`)
          reconnect(url)
        }, delay) as unknown as number
      } else {
        console.log(`达到最大重连次数 [${connectionId}]，停止重连`)
        currentConnectionId = null
        currentConnectionUrl = null
      }
    }
  }

  const handleInitMessage = (data: InitResponse) => {
    robotStore.initRobot(data.id, data.joints)
  }

  const handleMoveAck = (data: MoveAck) => {
    if (data.status === 'success') {
      console.log(`服务器确认关节 ${data.joint} 角度: ${data.angle}°`)
      // 服务器确认，不需要再发送到服务器
      // 注意：这里需要先移除状态锁，然后更新角度
      const store = robotStore as any
      if (store.sendingCommands) {
        store.sendingCommands.delete(data.joint)
      }
      robotStore.updateJointAngle(data.joint, data.angle, false)
    } else {
      console.error(`服务器拒绝关节 ${data.joint} 角度: ${data.angle}°`)
      // 服务器拒绝，也需要移除状态锁
      const store = robotStore as any
      if (store.sendingCommands) {
        store.sendingCommands.delete(data.joint)
      }
    }
  }

  // 心跳相关函数
  const startHeartbeat = () => {
    stopHeartbeat()
    
    heartbeatInterval = setInterval(() => {
      if (ws.value?.readyState === WebSocket.OPEN) {
        // 检查上次pong响应是否超时
        const now = Date.now()
        if (now - lastPongTime > PONG_TIMEOUT) {
          console.warn('心跳超时，重新连接')
          disconnect()
          return
        }
        
        // 发送ping消息
        try {
          ws.value.send(JSON.stringify({ type: 'ping', timestamp: now }))
        } catch (e) {
          console.error('发送心跳失败:', e)
        }
      }
    }, HEARTBEAT_INTERVAL) as unknown as number
  }

  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
  }

  const handlePong = (timestamp: number) => {
    lastPongTime = Date.now()
    console.log(`收到pong响应，延迟: ${lastPongTime - timestamp}ms`)
  }

  // 统一更新连接状态
  const updateConnectionStatus = (status: 'disconnected' | 'connecting' | 'connected', connectionId?: string) => {
    // 检查连接ID是否匹配（如果提供了connectionId）
    if (connectionId && currentConnectionId !== connectionId) {
      console.log(`忽略旧连接 [${connectionId}] 的状态更新，当前活跃连接: [${currentConnectionId}]`)
      return
    }
    
    isConnected.value = status === 'connected'
    robotStore.setConnectionStatus(status)
    
    // 清理错误状态
    if (status !== 'disconnected') {
      error.value = null
    }
    
    console.log(`连接状态更新 [${currentConnectionId || 'none'}]: ${status}`)
  }

  // 清理之前的连接
  const cleanupPreviousConnection = () => {
    console.log('清理之前的连接状态')
    
    // 停止心跳
    stopHeartbeat()
    
    // 清除重连定时器
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    
    // 重置重连尝试计数
    reconnectAttempts = 0
    
    // 关闭现有的WebSocket连接
    if (ws.value) {
      try {
        // 不设置isManualDisconnect，因为这是连接切换，不是用户主动断开
        ws.value.close(1000, '连接切换')
      } catch (e) {
        // 忽略关闭错误
      }
      ws.value = null
    }
    
    // 更新连接状态
    updateConnectionStatus('disconnected')
  }

  const reconnect = (url: string) => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    
    // 检查当前连接URL是否匹配
    if (currentConnectionUrl !== url) {
      console.log(`重连URL不匹配: 当前 ${currentConnectionUrl}, 目标 ${url}`)
      return
    }
    
    connect(url)
  }

  const sendMoveCommand = (jointId: string, angle: number) => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      const command: MoveRequest = { id: jointId, angel: angle }
      ws.value.send(JSON.stringify(command))
    }
  }

  const disconnect = () => {
    console.log(`用户主动断开连接 [${currentConnectionId}]`)
    isManualDisconnect = true
    
    stopHeartbeat()
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    
    if (ws.value) {
      try {
        ws.value.close(1000, '用户主动断开')
      } catch (e) {
        console.error('关闭WebSocket时出错:', e)
      }
      ws.value = null
    }
    
    updateConnectionStatus('disconnected')
    console.log('WebSocket已断开')
  }

  // 完全重置连接状态
  const resetConnection = () => {
    console.log('完全重置连接状态')
    
    // 重置所有状态变量
    isManualDisconnect = false
    currentConnectionId = null
    currentConnectionUrl = null
    reconnectAttempts = 0
    
    // 停止所有定时器
    stopHeartbeat()
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    
    // 关闭WebSocket
    if (ws.value) {
      try {
        ws.value.close(1000, '连接重置')
      } catch (e) {
        // 忽略错误
      }
      ws.value = null
    }
    
    // 更新状态
    updateConnectionStatus('disconnected')
    error.value = null
    
    console.log('连接状态已完全重置')
  }

  onUnmounted(() => {
    disconnect()
  })

  return { 
    connect, 
    sendMoveCommand, 
    disconnect,
    resetConnection,
    isConnected, 
    error 
  }
}