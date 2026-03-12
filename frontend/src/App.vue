<script setup lang="ts">
import { onMounted } from 'vue'
import ConnectionBar from './components/ConnectionBar.vue'
import ControlPanel from './components/ControlPanel.vue'
import ThreeViewer from './components/ThreeViewer.vue'
import { useWebSocket } from './composables/useWebSocket'
import { useRobotStore } from './stores/robot'

// 初始化WebSocket和store的集成
const { sendMoveCommand, isConnected } = useWebSocket()
const robotStore = useRobotStore()

// 将WebSocket功能注入到store中
onMounted(() => {
  robotStore.setWebSocketFunctions({
    sendMoveCommand,
    isConnected
  })
})
</script>

<template>
  <div class="app">
    <ConnectionBar class="connection-bar" />
    
    <div class="main-content">
      <ControlPanel class="control-panel" />
      <ThreeViewer class="three-viewer" />
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
}

.control-panel {
  width: 320px;
  flex-shrink: 0;
}

.three-viewer {
  flex: 1;
}
</style>
