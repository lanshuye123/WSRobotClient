<template>
  <div class="recording-panel">
    <div class="panel-header">
      <h3>动作录制</h3>
      <div class="connection-status" v-if="robotStore.robotId">
        <span class="status-dot connected"></span>
        <span class="status-text">已连接: {{ robotStore.robotId }}</span>
      </div>
      <div class="connection-status" v-else>
        <span class="status-dot disconnected"></span>
        <span class="status-text">未连接机器人</span>
      </div>
    </div>

    <div class="recording-controls">
      <div class="recording-status" :class="recordingStatusClass">
        <span class="status-icon">
          <span v-if="recordingStore.isRecording" class="recording-dot"></span>
          <span v-else-if="recordingStore.isPaused" class="paused-icon">⏸️</span>
          <span v-else class="idle-icon">●</span>
        </span>
        <span class="status-text">{{ recordingStatusText }}</span>
        <span class="duration" v-if="recordingStore.isRecording || recordingStore.isPaused">
          {{ formatDuration(recordingStore.recordingDuration) }}
        </span>
      </div>

      <div class="control-buttons">
        <button 
          @click="startRecording" 
          class="control-btn record-btn"
          :disabled="!robotStore.robotId || recordingStore.isRecording || recordingStore.isPaused"
          title="开始录制"
        >
          <span class="btn-icon">●</span>
          <span class="btn-text">录制</span>
        </button>
        
        <button 
          @click="pauseRecording" 
          class="control-btn pause-btn"
          :disabled="!recordingStore.isRecording"
          title="暂停录制"
        >
          <span class="btn-icon">⏸️</span>
          <span class="btn-text">暂停</span>
        </button>
        
        <button 
          @click="resumeRecording" 
          class="control-btn resume-btn"
          :disabled="!recordingStore.isPaused"
          title="继续录制"
        >
          <span class="btn-icon">▶️</span>
          <span class="btn-text">继续</span>
        </button>
        
        <button 
          @click="stopRecording" 
          class="control-btn stop-btn"
          :disabled="!recordingStore.isRecording && !recordingStore.isPaused"
          title="停止录制"
        >
          <span class="btn-icon">■</span>
          <span class="btn-text">停止</span>
        </button>
      </div>
    </div>

    <div class="recordings-list" v-if="recordingStore.hasRecordings">
      <div class="list-header">
        <h4>录制列表</h4>
        <button 
          @click="clearAllRecordings" 
          class="clear-btn"
          title="清空所有录制"
          :disabled="recordingStore.isRecording || recordingStore.isPlaying"
        >
          清空
        </button>
      </div>
      
      <div class="recordings-container">
        <div 
          v-for="recording in recordingStore.recordings" 
          :key="recording.id"
          class="recording-item"
          :class="{ selected: recordingStore.selectedRecordingId === recording.id }"
          @click="selectRecording(recording.id)"
        >
          <div class="recording-info">
            <div class="recording-name">{{ recording.name }}</div>
            <div class="recording-details">
              <span class="detail-item">
                <span class="detail-icon">🤖</span>
                {{ recording.robotId }}
              </span>
              <span class="detail-item">
                <span class="detail-icon">⏱️</span>
                {{ formatDuration(recording.duration) }}
              </span>
              <span class="detail-item">
                <span class="detail-icon">📅</span>
                {{ formatTime(recording.createdAt) }}
              </span>
            </div>
          </div>
          
          <div class="recording-actions">
            <button 
              @click.stop="exportRecording(recording.id)"
              class="action-btn export-btn"
              title="导出为JSON"
            >
              <span class="action-icon">📥</span>
              <span class="action-text">导出</span>
            </button>
            
            <button 
              @click.stop="deleteRecording(recording.id)"
              class="action-btn delete-btn"
              title="删除录制"
              :disabled="recordingStore.isRecording || recordingStore.isPlaying"
            >
              <span class="action-icon">🗑️</span>
              <span class="action-text">删除</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else>
      <div class="empty-icon">📁</div>
      <p class="empty-text">暂无录制</p>
      <p class="empty-hint">开始录制后，您的动作将显示在这里</p>
    </div>

    <div class="import-section">
      <input 
        type="file" 
        ref="fileInput"
        @change="handleFileImport"
        accept=".json"
        style="display: none"
      />
      <button 
        @click="triggerFileImport"
        class="import-btn"
        :disabled="recordingStore.isRecording || recordingStore.isPlaying"
      >
        <span class="import-icon">📤</span>
        <span class="import-text">导入录制文件</span>
      </button>
      <p class="import-hint">支持JSON格式的录制文件</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRobotStore } from '@/stores/robot'
import { useRecordingStore } from '@/stores/recording'
import { useRecording } from '@/composables/useRecording'
import { formatDuration, formatTime } from '@/utils/recordingUtils'

const robotStore = useRobotStore()
const recordingStore = useRecordingStore()
const recording = useRecording()

const fileInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  recordingStore.loadRecordings()
})

const recordingStatusClass = computed(() => {
  if (recordingStore.isRecording) return 'status-recording'
  if (recordingStore.isPaused) return 'status-paused'
  return 'status-idle'
})

const recordingStatusText = computed(() => {
  if (recordingStore.isRecording) return '录制中'
  if (recordingStore.isPaused) return '已暂停'
  return '准备录制'
})

const startRecording = () => {
  if (!robotStore.robotId) {
    alert('请先连接到机器人')
    return
  }
  recording.startRecording()
}

const pauseRecording = () => {
  recording.pauseRecording()
}

const resumeRecording = () => {
  recording.resumeRecording()
}

const stopRecording = () => {
  recording.stopRecording()
}

const selectRecording = (recordingId: string) => {
  recordingStore.selectRecording(recordingId)
}

const exportRecording = (recordingId: string) => {
  recording.exportRecording(recordingId)
}

const deleteRecording = (recordingId: string) => {
  if (confirm('确定要删除这个录制吗？')) {
    recordingStore.deleteRecording(recordingId)
  }
}

const clearAllRecordings = () => {
  if (confirm('确定要清空所有录制吗？此操作不可恢复。')) {
    recordingStore.clearAllRecordings()
  }
}

const triggerFileImport = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

  const handleFileImport = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return
    
    const file = input.files[0]
    if (!file) return
    
    try {
      await recording.importRecording(file)
      alert('录制文件导入成功！')
    } catch (error) {
      console.error('导入失败:', error)
      alert('导入失败: ' + (error as Error).message)
    }
    
    input.value = ''
  }
</script>

<style scoped>
.recording-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.panel-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.connected {
  background: #2ecc71;
}

.status-dot.disconnected {
  background: #e74c3c;
}

.status-text {
  color: #666;
}

.recording-controls {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.recording-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f8f9fa;
}

.status-recording {
  background: #ffeaea;
  border-left: 4px solid #e74c3c;
}

.status-paused {
  background: #fff3cd;
  border-left: 4px solid #f39c12;
}

.status-idle {
  background: #f8f9fa;
  border-left: 4px solid #95a5a6;
}

.status-icon {
  font-size: 14px;
}

.recording-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  background: #e74c3c;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

.paused-icon, .idle-icon {
  font-size: 12px;
}

.status-text {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.duration {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.control-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.control-btn {
  padding: 10px 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.record-btn {
  background: #e74c3c;
  color: white;
}

.record-btn:hover:not(:disabled) {
  background: #c0392b;
}

.pause-btn {
  background: #f39c12;
  color: white;
}

.pause-btn:hover:not(:disabled) {
  background: #d68910;
}

.resume-btn {
  background: #2ecc71;
  color: white;
}

.resume-btn:hover:not(:disabled) {
  background: #27ae60;
}

.stop-btn {
  background: #34495e;
  color: white;
}

.stop-btn:hover:not(:disabled) {
  background: #2c3e50;
}

.btn-icon {
  font-size: 12px;
}

.btn-text {
  font-size: 13px;
}

.recordings-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-header h4 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.clear-btn {
  padding: 4px 8px;
  border: 1px solid #e74c3c;
  border-radius: 4px;
  background: white;
  color: #e74c3c;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover:not(:disabled) {
  background: #e74c3c;
  color: white;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.recordings-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.recording-item {
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.recording-item:hover {
  background: #f8f9fa;
  border-color: #3498db;
}

.recording-item.selected {
  background: #ebf5fb;
  border-color: #3498db;
  border-left: 4px solid #3498db;
}

.recording-info {
  margin-bottom: 8px;
}

.recording-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.recording-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 11px;
  color: #666;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-icon {
  font-size: 10px;
}

.recording-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.export-btn {
  background: #3498db;
  color: white;
}

.export-btn:hover {
  background: #2980b9;
}

.delete-btn {
  background: #e74c3c;
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background: #c0392b;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  font-size: 10px;
}

.action-text {
  font-size: 11px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.empty-hint {
  margin: 0;
  font-size: 12px;
  text-align: center;
  max-width: 200px;
}

.import-section {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}

.import-btn {
  padding: 10px 16px;
  border: 2px dashed #3498db;
  border-radius: 6px;
  background: white;
  color: #3498db;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.import-btn:hover:not(:disabled) {
  background: #ebf5fb;
  border-color: #2980b9;
}

.import-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.import-icon {
  font-size: 16px;
}

.import-text {
  font-size: 13px;
}

.import-hint {
  margin: 8px 0 0 0;
  font-size: 11px;
  color: #666;
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