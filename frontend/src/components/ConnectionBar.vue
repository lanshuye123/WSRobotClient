<template>
  <div class="connection-bar">
    <div class="url-input-group">
      <label for="ws-url">WebSocket URL:</label>
      <input
        id="ws-url"
        type="text"
        v-model="wsUrl"
        placeholder="ws://localhost:8000/ws/six_axis"
        :disabled="isConnected"
        class="url-input"
      />
      <select v-model="robotType" :disabled="isConnected" class="robot-select">
        <option value="six_axis">6轴工业机械臂</option>
        <option value="scara">SCARA机器人</option>
      </select>
    </div>
    
    <div class="connection-controls">
      <button
        @click="connect"
        :disabled="isConnecting || isConnected"
        class="connect-btn"
      >
        {{ isConnecting ? '连接中...' : '连接' }}
      </button>
      
      <button
        @click="disconnect"
        :disabled="!isConnected"
        class="disconnect-btn"
      >
        断开
      </button>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-if="isConnecting" class="connecting-indicator">
      连接中...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWebSocket } from '@/composables/useWebSocket'
import { useRobotStore } from '@/stores/robot'

const wsUrl = ref('ws://localhost:8000/ws/six_axis')
const robotType = ref('six_axis')
const { connect: wsConnect, sendMoveCommand, disconnect: wsDisconnect, resetConnection, isConnected, error } = useWebSocket()
const robotStore = useRobotStore()

const isConnecting = computed(() => robotStore.connectionStatus === 'connecting')

const updateWsUrl = () => {
  const baseUrl = wsUrl.value.split('/ws/')[0] || 'ws://localhost:8000'
  wsUrl.value = `${baseUrl}/ws/${robotType.value}`
}

const connect = () => {
  updateWsUrl()
  wsConnect(wsUrl.value)
}

const disconnect = () => {
  console.log('用户点击断开连接')
  
  // 先重置连接状态，确保完全清理
  resetConnection()
  
  // 然后断开连接
  wsDisconnect()
  
  // 清理store状态
  robotStore.clearRobot()
  
  console.log('连接已完全断开并重置')
}

watch(robotType, updateWsUrl)
</script>

<style scoped>
.connection-bar {
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.url-input-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.url-input-group label {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
}

.url-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.url-input:disabled {
  background: #f5f5f5;
  color: #999;
}

.robot-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  min-width: 140px;
}

.robot-select:disabled {
  background: #f5f5f5;
  color: #999;
}

.connection-controls {
  display: flex;
  gap: 8px;
}

.connect-btn, .disconnect-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  min-width: 80px;
}

.connect-btn {
  background: #2ecc71;
  color: white;
}

.connect-btn:hover:not(:disabled) {
  background: #27ae60;
}

.connect-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.disconnect-btn {
  background: #e74c3c;
  color: white;
}

.disconnect-btn:hover:not(:disabled) {
  background: #c0392b;
}

.disconnect-btn:disabled {
  background: #f5b7b1;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 4px;
  position: absolute;
  bottom: -20px;
  left: 16px;
}

.connecting-indicator {
  color: #f39c12;
  font-size: 12px;
  margin-left: 12px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>