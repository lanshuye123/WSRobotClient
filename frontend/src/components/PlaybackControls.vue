<template>
  <div class="playback-controls">
    <div class="playback-header">
      <h4>回放控制</h4>
      <div class="playback-status" :class="playbackStatusClass">
        <span class="status-icon">
          <span v-if="recordingStore.isPlaying" class="playing-icon">▶️</span>
          <span v-else-if="recordingStore.playbackState.status === 'paused'" class="paused-icon">⏸️</span>
          <span v-else class="idle-icon">●</span>
        </span>
        <span class="status-text">{{ playbackStatusText }}</span>
      </div>
    </div>

    <div class="selected-recording" v-if="recordingStore.selectedRecording">
      <div class="recording-info">
        <div class="recording-name">{{ recordingStore.selectedRecording.name }}</div>
        <div class="recording-duration">
          {{ formatDuration(recordingStore.selectedRecording.duration) }}
        </div>
      </div>
    </div>
    <div class="no-selection" v-else>
      <p>请选择一个录制进行回放</p>
    </div>

    <div class="playback-progress">
      <div class="progress-bar" @click="handleProgressClick" ref="progressBar">
        <div class="progress-track"></div>
        <div 
          class="progress-fill" 
          :style="{ width: progressPercentage + '%' }"
        ></div>
        <div 
          class="progress-thumb" 
          :style="{ left: progressPercentage + '%' }"
        ></div>
      </div>
      
      <div class="time-display">
        <span class="current-time">{{ formatDuration(recordingStore.playbackState.currentTime) }}</span>
        <span class="total-time" v-if="recordingStore.selectedRecording">
          / {{ formatDuration(recordingStore.selectedRecording.duration) }}
        </span>
      </div>
    </div>

    <div class="control-buttons">
      <button 
        @click="startPlayback" 
        class="control-btn play-btn"
        :disabled="!recordingStore.selectedRecording || recordingStore.isPlaying"
        title="开始回放"
      >
        <span class="btn-icon">▶️</span>
        <span class="btn-text">播放</span>
      </button>
      
      <button 
        @click="pausePlayback" 
        class="control-btn pause-btn"
        :disabled="!recordingStore.isPlaying"
        title="暂停回放"
      >
        <span class="btn-icon">⏸️</span>
        <span class="btn-text">暂停</span>
      </button>
      
      <button 
        @click="stopPlayback" 
        class="control-btn stop-btn"
        :disabled="recordingStore.playbackState.status === 'idle'"
        title="停止回放"
      >
        <span class="btn-icon">■</span>
        <span class="btn-text">停止</span>
      </button>
      
      <button 
        @click="toggleLoop" 
        class="control-btn loop-btn"
        :class="{ active: recordingStore.playbackState.loop }"
        title="循环播放"
      >
        <span class="btn-icon">🔁</span>
        <span class="btn-text">循环</span>
      </button>
    </div>

    <div class="speed-control">
      <label class="speed-label">播放速度:</label>
      <div class="speed-buttons">
        <button 
          v-for="speed in speedOptions" 
          :key="speed"
          @click="setPlaybackSpeed(speed)"
          class="speed-btn"
          :class="{ active: recordingStore.playbackState.playbackSpeed === speed }"
        >
          {{ speed }}x
        </button>
      </div>
    </div>

    <div class="playback-actions">
      <button 
        @click="jumpToStart"
        class="action-btn jump-btn"
        :disabled="!recordingStore.selectedRecording"
        title="跳转到开始"
      >
        <span class="action-icon">⏮️</span>
        <span class="action-text">开始</span>
      </button>
      
      <button 
        @click="jumpToEnd"
        class="action-btn jump-btn"
        :disabled="!recordingStore.selectedRecording"
        title="跳转到结束"
      >
        <span class="action-icon">⏭️</span>
        <span class="action-text">结束</span>
      </button>
      
      <button 
        @click="stepBackward"
        class="action-btn step-btn"
        :disabled="!recordingStore.selectedRecording || recordingStore.isPlaying"
        title="后退一帧"
      >
        <span class="action-icon">◀️</span>
        <span class="action-text">后退</span>
      </button>
      
      <button 
        @click="stepForward"
        class="action-btn step-btn"
        :disabled="!recordingStore.selectedRecording || recordingStore.isPlaying"
        title="前进一帧"
      >
        <span class="action-icon">▶️</span>
        <span class="action-text">前进</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRecordingStore } from '@/stores/recording'
import { useRecording } from '@/composables/useRecording'
import { formatDuration } from '@/utils/recordingUtils'

const recordingStore = useRecordingStore()
const recording = useRecording()

const progressBar = ref<HTMLDivElement | null>(null)
const speedOptions = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 5.0]

const playbackStatusClass = computed(() => {
  if (recordingStore.isPlaying) return 'status-playing'
  if (recordingStore.playbackState.status === 'paused') return 'status-paused'
  return 'status-idle'
})

const playbackStatusText = computed(() => {
  if (recordingStore.isPlaying) return '回放中'
  if (recordingStore.playbackState.status === 'paused') return '已暂停'
  return '准备回放'
})

const progressPercentage = computed(() => {
  if (!recordingStore.selectedRecording || recordingStore.selectedRecording.duration === 0) {
    return 0
  }
  
  const percentage = (recordingStore.playbackState.currentTime / recordingStore.selectedRecording.duration) * 100
  return Math.min(100, Math.max(0, percentage))
})

const startPlayback = () => {
  if (!recordingStore.selectedRecording) return
  recording.startPlayback(recordingStore.selectedRecording.id)
}

const pausePlayback = () => {
  recording.pausePlayback()
}

const stopPlayback = () => {
  recording.stopPlayback()
}

const toggleLoop = () => {
  recordingStore.toggleLoop()
}

const setPlaybackSpeed = (speed: number) => {
  recordingStore.setPlaybackSpeed(speed)
}

const jumpToStart = () => {
  recordingStore.setPlaybackTime(0)
}

const jumpToEnd = () => {
  if (recordingStore.selectedRecording) {
    recordingStore.setPlaybackTime(recordingStore.selectedRecording.duration)
  }
}

  const stepBackward = () => {
    if (!recordingStore.selectedRecording) return
    
    const frame = recordingStore.getCurrentPlaybackFrame()
    if (!frame) return
    
    const frames = recordingStore.selectedRecording.frames
    if (frames.length === 0) return
    
    let targetIndex = 0
    for (let i = frames.length - 1; i >= 0; i--) {
      const frame = frames[i]
      if (frame && frame.timestamp < recordingStore.playbackState.currentTime) {
        targetIndex = i
        break
      }
    }
    
    const targetFrame = frames[targetIndex]
    if (targetFrame) {
      recordingStore.setPlaybackTime(targetFrame.timestamp)
    }
  }

  const stepForward = () => {
    if (!recordingStore.selectedRecording) return
    
    const frames = recordingStore.selectedRecording.frames
    if (frames.length === 0) return
    
    let targetIndex = frames.length - 1
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i]
      if (frame && frame.timestamp > recordingStore.playbackState.currentTime) {
        targetIndex = i
        break
      }
    }
    
    const targetFrame = frames[targetIndex]
    if (targetFrame) {
      recordingStore.setPlaybackTime(targetFrame.timestamp)
    }
  }

const handleProgressClick = (event: MouseEvent) => {
  if (!progressBar.value || !recordingStore.selectedRecording) return
  
  const rect = progressBar.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = (clickX / rect.width) * 100
  
  const newTime = (percentage / 100) * recordingStore.selectedRecording.duration
  recordingStore.setPlaybackTime(newTime)
}

onMounted(() => {
  // 确保在组件挂载时停止任何正在进行的回放
  if (recordingStore.isPlaying) {
    recording.stopPlayback()
  }
})

onUnmounted(() => {
  // 组件卸载时停止回放
  if (recordingStore.isPlaying) {
    recording.stopPlayback()
  }
})
</script>

<style scoped>
.playback-controls {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.playback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.playback-header h4 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.playback-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-playing {
  background: #d4edda;
  color: #155724;
}

.status-paused {
  background: #fff3cd;
  color: #856404;
}

.status-idle {
  background: #f8f9fa;
  color: #6c757d;
}

.status-icon {
  font-size: 10px;
}

.status-text {
  font-weight: 500;
}

.selected-recording {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 16px;
}

.recording-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recording-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.recording-duration {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.no-selection {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.playback-progress {
  margin-bottom: 16px;
}

.progress-bar {
  position: relative;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  cursor: pointer;
  margin-bottom: 8px;
}

.progress-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 3px;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #3498db;
  border-radius: 3px;
  transition: width 0.1s linear;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #3498db;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #666;
}

.current-time {
  font-family: monospace;
}

.total-time {
  font-family: monospace;
  color: #999;
}

.control-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.control-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
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

.play-btn {
  background: #2ecc71;
  color: white;
}

.play-btn:hover:not(:disabled) {
  background: #27ae60;
}

.pause-btn {
  background: #f39c12;
  color: white;
}

.pause-btn:hover:not(:disabled) {
  background: #d68910;
}

.stop-btn {
  background: #e74c3c;
  color: white;
}

.stop-btn:hover:not(:disabled) {
  background: #c0392b;
}

.loop-btn {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #dee2e6;
}

.loop-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.loop-btn.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.btn-icon {
  font-size: 11px;
}

.btn-text {
  font-size: 12px;
}

.speed-control {
  margin-bottom: 16px;
}

.speed-label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.speed-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.speed-btn {
  padding: 4px 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  color: #666;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.speed-btn:hover {
  background: #f8f9fa;
}

.speed-btn.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.playback-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.action-btn {
  padding: 6px 10px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  color: #666;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn:hover:not(:disabled) {
  background: #f8f9fa;
}

.jump-btn {
  background: #f8f9fa;
}

.step-btn {
  background: #f8f9fa;
}

.action-icon {
  font-size: 10px;
}

.action-text {
  font-size: 11px;
}
</style>