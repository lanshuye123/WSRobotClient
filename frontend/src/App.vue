<script setup lang="ts">
import { onMounted } from 'vue'
import ConnectionBar from './components/ConnectionBar.vue'
import ControlPanel from './components/ControlPanel.vue'
import ThreeViewer from './components/ThreeViewer.vue'
import RecordingPanel from './components/RecordingPanel.vue'
import PlaybackControls from './components/PlaybackControls.vue'
import { useWebSocket } from './composables/useWebSocket'
import { useRobotStore } from '@/stores/robot'
import { useUIStore } from '@/stores/ui'

// 初始化WebSocket和store的集成
const { sendMoveCommand, isConnected } = useWebSocket()
const robotStore = useRobotStore()
const uiStore = useUIStore()
</script>

<template>
  <div class="app">
    <ConnectionBar class="connection-bar" />
    
    <div class="main-content">
      <ControlPanel class="control-panel" />
      <ThreeViewer class="three-viewer" />
      
      <!-- 录制面板区域 -->
      <div class="panel-container recording-panel-container">
        <!-- 录制面板展开/收起按钮 -->
        <button 
          class="panel-toggle-btn recording-toggle"
          :class="{ expanded: uiStore.isRecordingPanelVisible }"
          @click="uiStore.toggleRecordingPanel"
          :title="uiStore.isRecordingPanelVisible ? '收起录制面板' : '展开录制面板'"
        >
          <span class="toggle-icon">🎬</span>
          <span class="toggle-text">录制</span>
          <span class="toggle-arrow">{{ uiStore.isRecordingPanelVisible ? '◀' : '▶' }}</span>
        </button>
        
        <!-- 录制面板内容 -->
        <div 
          class="panel-content recording-panel-content"
          :class="{ expanded: uiStore.isRecordingPanelVisible }"
        >
          <RecordingPanel />
        </div>
      </div>
    </div>
    
    <!-- 回放控制面板区域 -->
    <div class="panel-container playback-panel-container">
      <!-- 回放面板展开/收起按钮 -->
      <button 
        class="panel-toggle-btn playback-toggle"
        :class="{ expanded: uiStore.isPlaybackPanelVisible }"
        @click="uiStore.togglePlaybackPanel"
        :title="uiStore.isPlaybackPanelVisible ? '收起回放面板' : '展开回放面板'"
      >
        <span class="toggle-icon">🎵</span>
        <span class="toggle-text">回放</span>
        <span class="toggle-arrow">{{ uiStore.isPlaybackPanelVisible ? '▼' : '▲' }}</span>
      </button>
      
      <!-- 回放面板内容 -->
      <div 
        class="panel-content playback-panel-content"
        :class="{ expanded: uiStore.isPlaybackPanelVisible }"
      >
        <PlaybackControls />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.connection-bar {
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.control-panel {
  width: 320px;
  flex-shrink: 0;
}

.three-viewer {
  flex: 1;
  transition: margin-right 0.3s ease;
}

/* 录制面板容器 */
.recording-panel-container {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  z-index: 10;
}

/* 回放面板容器 */
.playback-panel-container {
  position: relative;
  display: flex;
  flex-direction: column;
  z-index: 10;
}

/* 面板切换按钮 */
.panel-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  background: #3498db;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  font-weight: 500;
  z-index: 20;
}

.panel-toggle-btn:hover {
  background: #2980b9;
}

.panel-toggle-btn.expanded {
  background: #2980b9;
}

/* 录制面板切换按钮 */
.recording-toggle {
  border-radius: 6px 0 0 6px;
  margin-top: 80px;
  height: 36px;
  box-shadow: -2px 0 4px rgba(0, 0, 0, 0.1);
}

/* 回放面板切换按钮 */
.playback-toggle {
  border-radius: 6px 6px 0 0;
  width: 80px;
  align-self: center;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}

/* 面板内容 */
.panel-content {
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* 录制面板内容 */
.recording-panel-content {
  width: 0;
  opacity: 0;
  border-left: 1px solid #e0e0e0;
}

.recording-panel-content.expanded {
  width: 320px;
  opacity: 1;
}

/* 回放面板内容 */
.playback-panel-content {
  height: 0;
  opacity: 0;
  border-top: 1px solid #e0e0e0;
}

.playback-panel-content.expanded {
  height: fit-content;
  opacity: 1;
}

/* 切换按钮图标和文字 */
.toggle-icon {
  font-size: 14px;
}

.toggle-text {
  font-size: 12px;
}

.toggle-arrow {
  font-size: 10px;
  margin-left: 4px;
}
</style>
