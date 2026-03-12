<template>
  <div class="control-panel">
    <div class="panel-header">
      <h3>机械臂控制</h3>
      <div class="robot-info" v-if="robotStore.robotId">
        <span class="robot-id">ID: {{ robotStore.robotId }}</span>
        <span class="joint-count">{{ robotStore.jointCount }} 个关节</span>
      </div>
    </div>
    
    <div class="connection-status" :class="connectionStatusClass">
      <span class="status-dot"></span>
      <span class="status-text">{{ connectionStatusText }}</span>
      <span v-if="robotStore.connectionStatus === 'connected' && robotStore.robotId" class="connection-info">
        ({{ robotStore.robotId }})
      </span>
      <span v-else-if="robotStore.connectionStatus === 'connecting'" class="connection-info">
        (连接中...)
      </span>
    </div>
    
    <div class="joints-list" v-if="robotStore.jointList.length > 0">
      <JointSlider
        v-for="joint in robotStore.jointList"
        :key="joint.id"
        :joint="joint"
        @angle-change="onJointAngleChange"
      />
    </div>
    
    <div v-else class="empty-state">
      <p>未连接机械臂</p>
      <p class="hint">请先连接到WebSocket服务器</p>
    </div>
    
    <div class="global-actions" v-if="robotStore.jointList.length > 0">
      <button @click="resetAllJoints" class="global-btn reset-all">
        全部复位
      </button>
      <button @click="deselectJoint" class="global-btn deselect" :disabled="!robotStore.selectedJoint">
        取消选择关节
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRobotStore } from '@/stores/robot'
import JointSlider from './JointSlider.vue'

const robotStore = useRobotStore()

const connectionStatusClass = computed(() => {
  return `status-${robotStore.connectionStatus}`
})

const connectionStatusText = computed(() => {
  const texts: Record<string, string> = {
    'disconnected': '未连接',
    'connecting': '连接中...',
    'connected': '已连接'
  }
  return texts[robotStore.connectionStatus]
})

const onJointAngleChange = (jointId: string, angle: number) => {
  robotStore.updateJointAngle(jointId, angle)
}

const resetAllJoints = () => {
  robotStore.resetAllJoints()
}

const deselectJoint = () => {
  robotStore.selectJoint(null)
}
</script>

<style scoped>
.control-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-right: 1px solid #e0e0e0;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.panel-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
}

.robot-info {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.robot-id {
  color: #3498db;
  font-weight: 500;
}

.joint-count {
  color: #666;
}

.connection-status {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-disconnected .status-dot {
  background: #e74c3c;
}

.status-connecting .status-dot {
  background: #f39c12;
  animation: pulse 1.5s infinite;
}

.status-connected .status-dot {
  background: #2ecc71;
}

.status-text {
  font-size: 14px;
  color: #333;
}

.connection-info {
  font-size: 12px;
  color: #666;
  margin-left: 4px;
}

.joints-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
  padding: 40px 20px;
}

.empty-state p {
  margin: 0;
}

.empty-state .hint {
  font-size: 12px;
  margin-top: 8px;
}

.global-actions {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.global-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-all {
  background: #3498db;
  color: white;
}

.reset-all:hover {
  background: #2980b9;
}

.deselect {
  background: #f5f5f5;
  color: #666;
}

.deselect:hover:not(:disabled) {
  background: #e0e0e0;
}

.deselect:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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