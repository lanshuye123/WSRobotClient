import { ref, onUnmounted, watch } from 'vue'
import { useRobotStore } from '@/stores/robot'
import { useRecordingStore } from '@/stores/recording'
import { useUIStore } from '@/stores/ui'
import type { RecordingFrame } from '@/types/recording'

const SAMPLING_INTERVAL = 50 // 50ms采样间隔

export function useRecording() {
  const robotStore = useRobotStore()
  const recordingStore = useRecordingStore()
  const uiStore = useUIStore()
  
  const samplingTimer = ref<number | null>(null)
  const playbackTimer = ref<number | null>(null)
  const lastPlaybackTime = ref<number>(0)

  const startSampling = () => {
    if (samplingTimer.value) return
    
    samplingTimer.value = setInterval(() => {
      if (recordingStore.isRecording && robotStore.robotId) {
        const joints: Record<string, number> = {}
        
        robotStore.jointList.forEach(joint => {
          joints[joint.id] = joint.currentAngle
        })
        
        recordingStore.addRecordingFrame(joints)
      }
    }, SAMPLING_INTERVAL) as unknown as number
  }

  const stopSampling = () => {
    if (samplingTimer.value) {
      clearInterval(samplingTimer.value)
      samplingTimer.value = null
    }
  }

  const startPlaybackLoop = () => {
    if (playbackTimer.value) return
    
    lastPlaybackTime.value = Date.now()
    
    const updatePlayback = () => {
      if (!recordingStore.isPlaying || !recordingStore.playbackState.currentRecordingId) {
        stopPlaybackLoop()
        return
      }
      
      const now = Date.now()
      const delta = now - lastPlaybackTime.value
      lastPlaybackTime.value = now
      
      const recording = recordingStore.recordings.find(
        r => r.id === recordingStore.playbackState.currentRecordingId
      )
      
      if (!recording) {
        stopPlaybackLoop()
        return
      }
      
      const speed = recordingStore.playbackState.playbackSpeed
      const newTime = recordingStore.playbackState.currentTime + delta * speed
      
      if (newTime >= recording.duration) {
        if (recordingStore.playbackState.loop) {
          recordingStore.setPlaybackTime(0)
        } else {
          recordingStore.stopPlayback()
          stopPlaybackLoop()
          return
        }
      } else {
        recordingStore.setPlaybackTime(newTime)
      }
      
      const frame = recordingStore.getCurrentPlaybackFrame()
      if (frame) {
        applyFrameToRobot(frame)
      }
      
      playbackTimer.value = requestAnimationFrame(updatePlayback) as unknown as number
    }
    
    playbackTimer.value = requestAnimationFrame(updatePlayback) as unknown as number
  }

  const stopPlaybackLoop = () => {
    if (playbackTimer.value) {
      cancelAnimationFrame(playbackTimer.value)
      playbackTimer.value = null
    }
  }

  const applyFrameToRobot = (frame: RecordingFrame) => {
    Object.entries(frame.joints).forEach(([jointId, angle]) => {
      robotStore.updateJointAngle(jointId, angle, false)
    })
  }

  const startRecording = () => {
    if (!robotStore.robotId) {
      console.error('无法开始录制: 未连接机器人')
      return
    }
    
    recordingStore.startRecording(robotStore.robotId)
    startSampling()
    
    // 自动展开录制面板
    uiStore.showRecordingPanel()
  }

  const pauseRecording = () => {
    recordingStore.pauseRecording()
    stopSampling()
  }

  const resumeRecording = () => {
    recordingStore.resumeRecording()
    startSampling()
  }

  const stopRecording = () => {
    recordingStore.stopRecording()
    stopSampling()
  }

  const startPlayback = (recordingId: string) => {
    recordingStore.startPlayback(recordingId)
    startPlaybackLoop()
    
    // 自动展开回放面板
    uiStore.showPlaybackPanel()
  }

  const pausePlayback = () => {
    recordingStore.pausePlayback()
    stopPlaybackLoop()
  }

  const resumePlayback = () => {
    recordingStore.resumePlayback()
    startPlaybackLoop()
  }

  const stopPlayback = () => {
    recordingStore.stopPlayback()
    stopPlaybackLoop()
  }

  const exportRecording = (recordingId: string) => {
    const jsonData = recordingStore.exportRecording(recordingId)
    if (jsonData) {
      const recording = recordingStore.recordings.find(r => r.id === recordingId)
      if (recording) {
        const blob = new Blob([jsonData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        
        link.href = url
        link.download = `${recording.name}_${new Date(recording.createdAt).toISOString().split('T')[0]}.json`
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        URL.revokeObjectURL(url)
      }
    }
  }

  const importRecording = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const jsonData = event.target?.result as string
          const recording = recordingStore.importRecording(jsonData)
          resolve(recording)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      reader.readAsText(file)
    })
  }

  watch(
    () => recordingStore.isRecording,
    (isRecording) => {
      if (isRecording) {
        startSampling()
      } else {
        stopSampling()
      }
    }
  )

  watch(
    () => recordingStore.isPlaying,
    (isPlaying) => {
      if (isPlaying) {
        startPlaybackLoop()
      } else {
        stopPlaybackLoop()
      }
    }
  )

  watch(
    () => robotStore.connectionStatus,
    (status) => {
      if (status === 'disconnected') {
        if (recordingStore.isRecording) {
          stopRecording()
        }
        if (recordingStore.isPlaying) {
          stopPlayback()
        }
      }
    }
  )

  onUnmounted(() => {
    stopSampling()
    stopPlaybackLoop()
    
    if (recordingStore.isRecording) {
      stopRecording()
    }
    
    if (recordingStore.isPlaying) {
      stopPlayback()
    }
  })

  return {
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    startPlayback,
    pausePlayback,
    resumePlayback,
    stopPlayback,
    exportRecording,
    importRecording,
    isRecording: () => recordingStore.isRecording,
    isPlaying: () => recordingStore.isPlaying,
    isPaused: () => recordingStore.isPaused,
    currentRecording: () => recordingStore.currentRecording,
    selectedRecording: () => recordingStore.selectedRecording,
    recordings: () => recordingStore.recordings,
    recordingDuration: () => recordingStore.recordingDuration,
    playbackState: () => recordingStore.playbackState
  }
}